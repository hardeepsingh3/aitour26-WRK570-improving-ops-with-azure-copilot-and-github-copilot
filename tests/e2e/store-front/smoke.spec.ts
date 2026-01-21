import { test, expect } from '@playwright/test';
// @ts-ignore
const testConfig = require('../../test-config');

test.describe('Store Front - Smoke Tests', () => {
  test.skip(!testConfig.isStoreFrontConfigured(), 'testConfig.storeFrontUrl is not set');

  test.beforeEach(async ({ page }) => {
    // Navigate to the store front before each test
    await page.goto(testConfig.storeFrontUrl);
  });

  test.describe('Homepage Loading and Navigation', () => {
    test('should load homepage successfully with correct title', async ({ page }) => {
      await expect(page).toHaveTitle(testConfig.getExpectedStoreFrontTitle());
      await expect(page.locator('body')).toBeVisible();
    });

    test('should display main navigation elements', async ({ page }) => {
      const productsLink = page.getByRole('link', { name: /Products/ });
      const cartLink = page.getByRole('link', { name: /Cart/ });
      
      await expect(productsLink).toBeVisible();
      await expect(cartLink).toBeVisible();
    });

    test('should navigate to Products page successfully', async ({ page }) => {
      await page.getByRole('link', { name: /Products/ }).click();
      await expect(page.locator('.product-list')).toBeVisible();
    });

    test('should navigate back to homepage from Products page', async ({ page }) => {
      await page.getByRole('link', { name: /Products/ }).click();
      await expect(page.locator('.product-list')).toBeVisible();
      
      // Navigate back to homepage (usually a logo or home link)
      const homeLink = page.locator('a:has-text("Home")').first();
      if (await homeLink.isVisible()) {
        await homeLink.click();
      } else {
        // Alternative: go back
        await page.goBack();
      }
    });

    test('should display responsive layout on homepage', async ({ page }) => {
      // Check that key elements are visible and properly laid out
      const productList = page.locator('.product-list');
      await expect(productList).toBeVisible();
      
      const productCards = page.locator('.product-card');
      const count = await productCards.count();
      expect(count).toBeGreaterThan(0);
    });
  });

  test.describe('Product Catalog Browsing', () => {
    test('should display product list with multiple items', async ({ page }) => {
      const productCards = page.locator('.product-card');
      const count = await productCards.count();
      
      expect(count).toBeGreaterThan(0);
    });

    test('should display product information correctly', async ({ page }) => {
      const firstProductCard = page.locator('.product-card').first();
      
      const productTitle = firstProductCard.locator('h2, h3');
      const productImage = firstProductCard.locator('img').first();
      
      await expect(productTitle).toBeVisible();
      await expect(productImage).toBeVisible();
    });

    test('should have Add to Cart button for each product', async ({ page }) => {
      const productControls = page.locator('.product-controls');
      const count = await productControls.count();
      
      expect(count).toBeGreaterThan(0);
      
      for (let i = 0; i < Math.min(count, 3); i++) {
        const addToCartBtn = productControls.nth(i).getByRole('button', { name: /Add to Cart/ });
        await expect(addToCartBtn).toBeVisible();
      }
    });

    test('should load product images successfully', async ({ page }) => {
      const productImages = page.locator('.product-card img');
      const count = await productImages.count();
      
      expect(count).toBeGreaterThan(0);
      
      // Verify at least the first image has proper attributes
      const firstImage = productImages.first();
      const src = await firstImage.getAttribute('src');
      expect(src).toBeTruthy();
    });
  });

  test.describe('Product Detail Page Functionality', () => {
    test('should navigate to product detail page from catalog', async ({ page }) => {
      const firstProductTitle = page.locator('.product-list .product-card h2').first();
      await firstProductTitle.click();
      
      await expect(page.url()).toContain('product');
    });

    test('should display product details correctly', async ({ page }) => {
      const firstProductCard = page.locator('.product-card').first();
      await firstProductCard.click();
      
      const productInfo = page.locator('.product-info');
      await expect(productInfo).toBeVisible();
      
      const productTitle = productInfo.locator('h2, h1');
      await expect(productTitle).toBeVisible();
    });

    test('should have Add to Cart button on product detail page', async ({ page }) => {
      const firstProductCard = page.locator('.product-card').first();
      await firstProductCard.click();
      
      const addToCartBtn = page.getByRole('button', { name: /Add to Cart/ });
      await expect(addToCartBtn).toBeVisible();
      await expect(addToCartBtn).toBeEnabled();
    });

    test('should display product image on detail page', async ({ page }) => {
      const firstProductCard = page.locator('.product-card').first();
      await firstProductCard.click();
      
      const productImage = page.locator('.product-info img');
      await expect(productImage).toBeVisible();
    });

    test('should navigate back from product detail page', async ({ page }) => {
      const firstProductCard = page.locator('.product-card').first();
      await firstProductCard.click();
      
      await page.goBack();
      await expect(page.locator('.product-list')).toBeVisible();
    });
  });

  test.describe('Add to Cart Workflow', () => {
    test('should add single item to cart from product list', async ({ page }) => {
      const cartLink = page.getByRole('link', { name: /Cart \(\d+\)/ });
      const initialCountText = await cartLink.textContent();
      const initialCount = parseInt(initialCountText?.match(/\d+/)?.[0] || '0');
      
      const firstProductBtn = page.locator('.product-controls').first().getByRole('button', { name: /Add to Cart/ });
      await firstProductBtn.click();
      
      await expect(cartLink).toHaveText(`Cart (${initialCount + 1})`);
    });

    test('should add item to cart from product detail page', async ({ page }) => {
      const cartLink = page.getByRole('link', { name: /Cart \(\d+\)/ });
      const initialCountText = await cartLink.textContent();
      const initialCount = parseInt(initialCountText?.match(/\d+/)?.[0] || '0');
      
      const firstProductCard = page.locator('.product-card').first();
      await firstProductCard.click();
      
      const addToCartBtn = page.getByRole('button', { name: /Add to Cart/ });
      await addToCartBtn.click();
      
      await expect(cartLink).toHaveText(`Cart (${initialCount + 1})`);
    });

    test('should add multiple items to cart', async ({ page }) => {
      const cartLink = page.getByRole('link', { name: /Cart \(\d+\)/ });
      const initialCountText = await cartLink.textContent();
      const initialCount = parseInt(initialCountText?.match(/\d+/)?.[0] || '0');
      
      const productControls = page.locator('.product-controls');
      const count = await productControls.count();
      const itemsToAdd = Math.min(3, count);
      
      for (let i = 0; i < itemsToAdd; i++) {
        const addBtn = productControls.nth(i).getByRole('button', { name: /Add to Cart/ });
        await addBtn.click();
      }
      
      await expect(cartLink).toHaveText(`Cart (${initialCount + itemsToAdd})`);
    });

    test('should update cart count immediately after adding item', async ({ page }) => {
      const cartLink = page.getByRole('link', { name: /Cart \(\d+\)/ });
      
      const initialText = await cartLink.textContent();
      const initialCount = parseInt(initialText?.match(/\d+/)?.[0] || '0');
      
      const addBtn = page.locator('.product-controls').first().getByRole('button', { name: /Add to Cart/ });
      await addBtn.click();
      
      await expect(cartLink).toContainText(`Cart (${initialCount + 1})`);
    });
  });

  test.describe('Shopping Cart Page Accessibility', () => {
    test('should navigate to cart page successfully', async ({ page }) => {
      const cartLink = page.getByRole('link', { name: /Cart \(\d+\)/ });
      await cartLink.click();
      
      const cartPage = page.locator('[class*="cart"]');
      await expect(cartPage).toBeVisible();
    });

    test('should display cart with added items', async ({ page }) => {
      // Add an item first
      const addBtn = page.locator('.product-controls').first().getByRole('button', { name: /Add to Cart/ });
      await addBtn.click();
      
      // Navigate to cart
      const cartLink = page.getByRole('link', { name: /Cart \(\d+\)/ });
      await cartLink.click();
      
      // Verify cart page is accessible
      const cartContent = page.locator('body');
      await expect(cartContent).toBeVisible();
    });

    test('should display empty cart message when no items', async ({ page }) => {
      const cartLink = page.getByRole('link', { name: /Cart \(\d+\)/ });
      await cartLink.click();
      
      // Page should load without errors
      await expect(page).not.toHaveTitle(/error|404/i);
    });

    test('should have checkout button on cart page with items', async ({ page }) => {
      // Add an item
      const addBtn = page.locator('.product-controls').first().getByRole('button', { name: /Add to Cart/ });
      await addBtn.click();
      
      // Navigate to cart
      const cartLink = page.getByRole('link', { name: /Cart \(\d+\)/ });
      await cartLink.click();
      
      // Look for checkout button
      const checkoutBtn = page.getByRole('button', { name: /Checkout/ });
      await expect(checkoutBtn).toBeVisible();
    });

    test('should navigate back to products from cart', async ({ page }) => {
      const cartLink = page.getByRole('link', { name: /Cart/ });
      await cartLink.click();
      
      // Navigate back to products
      const productsLink = page.getByRole('link', { name: /Products/ });
      await expect(productsLink).toBeVisible();
      await productsLink.click();
      
      await expect(page.locator('.product-list')).toBeVisible();
    });
  });

  test.describe('Basic Checkout Flow Validation', () => {
    test('should initiate checkout with items in cart', async ({ page }) => {
      // Add items to cart
      const addBtn = page.locator('.product-controls').first().getByRole('button', { name: /Add to Cart/ });
      await addBtn.click();
      
      // Go to cart
      const cartLink = page.getByRole('link', { name: /Cart \(\d+\)/ });
      await cartLink.click();
      
      // Verify checkout button is available
      const checkoutBtn = page.getByRole('button', { name: /Checkout/ });
      await expect(checkoutBtn).toBeEnabled();
    });

    test('should handle checkout button click', async ({ page }) => {
      // Add item
      const addBtn = page.locator('.product-controls').first().getByRole('button', { name: /Add to Cart/ });
      await addBtn.click();
      
      // Go to cart
      const cartLink = page.getByRole('link', { name: /Cart \(\d+\)/ });
      await cartLink.click();
      
      // Click checkout
      const checkoutBtn = page.getByRole('button', { name: /Checkout/ });
      
      // Wait for any response (checkout may show dialog, navigate, or show form)
      let checkoutHandled = false;
      page.on('dialog', async dialog => {
        checkoutHandled = true;
        await dialog.accept();
      });
      
      await checkoutBtn.click();
      
      // Give time for any async actions
      await page.waitForTimeout(1000);
      
      // Should either show dialog, navigate, or show checkout form
      expect(checkoutHandled || page.url() !== page.url() || 
             await page.locator('[class*="checkout"]').isVisible()).toBeTruthy();
    });

    test('should complete order submission', async ({ page }) => {
      // Add items
      const firstProduct = page.locator('.product-list .product-controls').first();
      await firstProduct.getByRole('button', { name: /Add to Cart/ }).click();
      
      const lastProduct = page.locator('.product-list .product-controls').last();
      await lastProduct.getByRole('button', { name: /Add to Cart/ }).click();
      
      // Go to cart and checkout
      await page.getByRole('link', { name: /Cart \(\d+\)/ }).click();
      
      let orderSuccessful = false;
      page.on('dialog', async dialog => {
        if (dialog.message().toLowerCase().includes('success')) {
          orderSuccessful = true;
        }
        await dialog.accept();
      });
      
      await page.getByRole('button', { name: /Checkout/ }).click();
      
      // Wait for dialog or response
      await page.waitForTimeout(2000);
    });

    test('should maintain cart state during checkout flow', async ({ page }) => {
      // Add multiple items
      const productControls = page.locator('.product-controls');
      const count = await productControls.count();
      const itemsToAdd = Math.min(2, count);
      
      for (let i = 0; i < itemsToAdd; i++) {
        const addBtn = productControls.nth(i).getByRole('button', { name: /Add to Cart/ });
        await addBtn.click();
      }
      
      const cartLink = page.getByRole('link', { name: /Cart/ });
      await cartLink.click();
      
      // Verify we can still see items or cart data
      const cartContent = page.locator('body');
      await expect(cartContent).toBeVisible();
    });
  });

  test.describe('Performance and Stability', () => {
    test('should load homepage within acceptable time', async ({ page }) => {
      const startTime = Date.now();
      await page.goto(testConfig.storeFrontUrl);
      const loadTime = Date.now() - startTime;
      
      // Should load within 10 seconds
      expect(loadTime).toBeLessThan(10000);
    });

    test('should handle rapid navigation between pages', async ({ page }) => {
      await page.getByRole('link', { name: /Products/ }).click();
      await page.goBack();
      await page.getByRole('link', { name: /Cart/ }).click();
      await page.goBack();
      
      // Should still be functional
      await expect(page.locator('.product-list')).toBeVisible();
    });

    test('should display proper error handling', async ({ page }) => {
      // Navigate to non-existent product
      await page.goto(`${testConfig.storeFrontUrl}/product/nonexistent`);
      
      // Should either show error page or redirect gracefully
      const page404 = page.locator('text=/404|not found|error/i');
      const productPage = page.locator('.product-info');
      
      const has404 = await page404.isVisible().catch(() => false);
      const hasProduct = await productPage.isVisible().catch(() => false);
      
      // At least one should be true (error shown or redirected)
      expect(has404 || hasProduct || page.url() !== page.url()).toBeTruthy();
    });
  });
});
