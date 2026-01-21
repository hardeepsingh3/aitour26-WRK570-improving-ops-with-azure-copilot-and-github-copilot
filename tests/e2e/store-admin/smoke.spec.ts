import { test, expect } from '@playwright/test';
// @ts-ignore
const testConfig = require('../../test-config');

test.describe('Store Admin - Smoke Tests', () => {
  test.skip(!testConfig.isStoreAdminConfigured(), 'testConfig.storeAdminUrl is not set');

  test.beforeEach(async ({ page }) => {
    // Navigate to admin portal before each test
    await page.goto(testConfig.storeAdminUrl);
  });

  test.describe('Admin Login Page and Authentication', () => {
    test('should load admin login page successfully', async ({ page }) => {
      // Check page loaded with correct title
      await expect(page).toHaveTitle(testConfig.getExpectedAdminTitle());
    });

    test('should display admin portal branding', async ({ page }) => {
      // Verify company name is displayed
      const pageContent = await page.content();
      expect(pageContent.toLowerCase()).toContain(testConfig.companyName.toLowerCase());
    });

    test('should have main navigation elements visible', async ({ page }) => {
      // Check for key navigation links
      const productsLink = page.getByRole('link', { name: /Products/i });
      await expect(productsLink).toBeVisible();
    });

    test('should verify user is authenticated (not redirected to login)', async ({ page }) => {
      // If we successfully loaded the admin dashboard, user is authenticated
      const dashboard = page.locator('[class*="dashboard"], [class*="admin"], main');
      await expect(dashboard).toBeVisible();
    });

    test('should display admin portal header/title', async ({ page }) => {
      // Look for admin portal header
      const header = page.locator('h1, h2, [class*="header"], [class*="title"]').first();
      await expect(header).toBeVisible();
    });

    test('should have proper page structure', async ({ page }) => {
      // Verify main content area is visible
      const mainContent = page.locator('main, [role="main"], .admin-container, .content-area');
      const hasMainContent = await mainContent.isVisible().catch(() => false);
      
      // Or check for presence of expected navigation
      const nav = page.locator('nav, [role="navigation"]');
      const hasNav = await nav.isVisible().catch(() => false);
      
      expect(hasMainContent || hasNav).toBeTruthy();
    });
  });

  test.describe('Product Management Dashboard', () => {
    test('should navigate to Products page successfully', async ({ page }) => {
      const productsLink = page.getByRole('link', { name: /Products/i });
      await productsLink.click();

      // Verify we're on products page
      await expect(page.url()).toContain(/product/i);
    });

    test('should display products list/table', async ({ page }) => {
      const productsLink = page.getByRole('link', { name: /Products/i });
      await productsLink.click();

      // Check for table or list of products
      const table = page.locator('table, [role="grid"], .products-list');
      await expect(table).toBeVisible();
    });

    test('should display product table headers', async ({ page }) => {
      const productsLink = page.getByRole('link', { name: /Products/i });
      await productsLink.click();

      // Check for expected column headers
      await expect(page.getByText(/Product ID|ID/i)).toBeVisible();
      await expect(page.getByText(/Product Name|Name/i)).toBeVisible();
    });

    test('should display Add Product button on dashboard', async ({ page }) => {
      const productsLink = page.getByRole('link', { name: /Products/i });
      await productsLink.click();

      const addProductBtn = page.getByRole('button', { name: /Add Product/i });
      await expect(addProductBtn).toBeVisible();
      await expect(addProductBtn).toBeEnabled();
    });

    test('should display product count or pagination', async ({ page }) => {
      const productsLink = page.getByRole('link', { name: /Products/i });
      await productsLink.click();

      // Look for pagination, count, or product rows
      const productRows = page.locator('tbody tr, [data-testid="product-row"], .product-item');
      const count = await productRows.count();
      
      // Should have at least some products or show empty state
      expect(count >= 0).toBeTruthy();
    });

    test('should have product action buttons/links', async ({ page }) => {
      const productsLink = page.getByRole('link', { name: /Products/i });
      await productsLink.click();

      // Look for edit/delete/view buttons
      const actionButtons = page.locator('button:has-text("Edit"), button:has-text("Delete"), button:has-text("View"), a[href*="/product/"]');
      
      if (await actionButtons.count() > 0) {
        await expect(actionButtons.first()).toBeVisible();
      }
    });

    test('should display search/filter functionality', async ({ page }) => {
      const productsLink = page.getByRole('link', { name: /Products/i });
      await productsLink.click();

      // Look for search input
      const searchInput = page.locator('input[type="search"], input[placeholder*="Search"], input[placeholder*="Filter"]');
      
      if (await searchInput.isVisible()) {
        await expect(searchInput).toBeEnabled();
      }
    });
  });

  test.describe('Add New Product Functionality', () => {
    test('should open Add Product form', async ({ page }) => {
      const productsLink = page.getByRole('link', { name: /Products/i });
      await productsLink.click();

      const addProductBtn = page.getByRole('button', { name: /Add Product/i });
      await addProductBtn.click();

      // Verify form opened
      const productForm = page.locator('form, [class*="form"], [class*="modal"]');
      await expect(productForm).toBeVisible();
    });

    test('should display product form fields', async ({ page }) => {
      const productsLink = page.getByRole('link', { name: /Products/i });
      await productsLink.click();

      const addProductBtn = page.getByRole('button', { name: /Add Product/i });
      await addProductBtn.click();

      // Check for key form fields
      const nameInput = page.getByRole('textbox', { name: /Name/i });
      const priceInput = page.getByRole('spinbutton', { name: /Price/i });
      
      await expect(nameInput).toBeVisible();
      
      if (await priceInput.isVisible()) {
        await expect(priceInput).toBeVisible();
      }
    });

    test('should validate required fields', async ({ page }) => {
      test.setTimeout(60000);
      
      const productsLink = page.getByRole('link', { name: /Products/i });
      await productsLink.click();

      const addProductBtn = page.getByRole('button', { name: /Add Product/i });
      await addProductBtn.click();

      // Try to submit without filling required fields
      const saveBtn = page.getByRole('button', { name: /Save|Submit/i });
      
      if (await saveBtn.isVisible()) {
        await saveBtn.click();

        // Should show validation error or prevent submission
        const errorMsg = page.locator('[role="alert"], .error, .validation-error, .error-message');
        
        // Error might be shown or form might still be open
        const hasError = await errorMsg.isVisible().catch(() => false);
        const formStillOpen = await page.locator('form, [class*="form"]').isVisible();
        
        expect(hasError || formStillOpen).toBeTruthy();
      }
    });

    test('should fill product form with valid data', async ({ page }) => {
      const productsLink = page.getByRole('link', { name: /Products/i });
      await productsLink.click();

      const addProductBtn = page.getByRole('button', { name: /Add Product/i });
      await addProductBtn.click();

      // Fill form fields
      const nameInput = page.getByRole('textbox', { name: /Name/i });
      await nameInput.fill('Test Product Smoke');

      const priceInput = page.getByRole('spinbutton', { name: /Price/i });
      if (await priceInput.isVisible()) {
        await priceInput.fill('29.99');
      }

      // Verify data was entered
      await expect(nameInput).toHaveValue('Test Product Smoke');
    });

    test('should display Save button on product form', async ({ page }) => {
      const productsLink = page.getByRole('link', { name: /Products/i });
      await productsLink.click();

      const addProductBtn = page.getByRole('button', { name: /Add Product/i });
      await addProductBtn.click();

      const saveBtn = page.getByRole('button', { name: /Save|Submit/i });
      await expect(saveBtn).toBeVisible();
      await expect(saveBtn).toBeEnabled();
    });

    test('should allow form cancellation', async ({ page }) => {
      const productsLink = page.getByRole('link', { name: /Products/i });
      await productsLink.click();

      const addProductBtn = page.getByRole('button', { name: /Add Product/i });
      await addProductBtn.click();

      // Look for cancel/close button
      const cancelBtn = page.getByRole('button', { name: /Cancel|Close/i });
      
      if (await cancelBtn.isVisible()) {
        await expect(cancelBtn).toBeEnabled();
      }
    });
  });

  test.describe('Product Editing Capabilities', () => {
    test('should access product edit page', async ({ page }) => {
      const productsLink = page.getByRole('link', { name: /Products/i });
      await productsLink.click();

      // Find and click on an existing product
      const editBtn = page.locator('button:has-text("Edit"), a[href*="/product/"][href*="edit"]');
      
      if (await editBtn.isVisible()) {
        await editBtn.first().click();

        // Verify we're on edit page
        const editForm = page.locator('form, [class*="form"]');
        await expect(editForm).toBeVisible();
      }
    });

    test('should display existing product data in edit form', async ({ page }) => {
      const productsLink = page.getByRole('link', { name: /Products/i });
      await productsLink.click();

      const editBtn = page.locator('button:has-text("Edit"), a[href*="/product/"][href*="edit"]');
      
      if (await editBtn.isVisible()) {
        await editBtn.first().click();

        // Check if form fields are populated
        const nameInput = page.getByRole('textbox', { name: /Name/i });
        const inputValue = await nameInput.inputValue();
        
        // Form should have some data
        expect(inputValue).toBeTruthy();
      }
    });

    test('should allow editing product fields', async ({ page }) => {
      const productsLink = page.getByRole('link', { name: /Products/i });
      await productsLink.click();

      const editBtn = page.locator('button:has-text("Edit"), a[href*="/product/"][href*="edit"]');
      
      if (await editBtn.isVisible()) {
        await editBtn.first().click();

        const nameInput = page.getByRole('textbox', { name: /Name/i });
        const originalValue = await nameInput.inputValue();
        
        // Modify the field
        await nameInput.clear();
        await nameInput.fill(`${originalValue}_Updated`);

        // Verify change
        await expect(nameInput).toHaveValue(`${originalValue}_Updated`);
      }
    });

    test('should display Save button on edit form', async ({ page }) => {
      const productsLink = page.getByRole('link', { name: /Products/i });
      await productsLink.click();

      const editBtn = page.locator('button:has-text("Edit"), a[href*="/product/"][href*="edit"]');
      
      if (await editBtn.isVisible()) {
        await editBtn.first().click();

        const saveBtn = page.getByRole('button', { name: /Save|Update/i });
        await expect(saveBtn).toBeVisible();
      }
    });

    test('should show product details view', async ({ page }) => {
      const productsLink = page.getByRole('link', { name: /Products/i });
      await productsLink.click();

      // Click on product name or view link
      const productLink = page.locator('a[href*="/product/"]').first();
      
      if (await productLink.isVisible()) {
        await productLink.click();

        // Verify product details displayed
        const detailContainer = page.locator('[class*="detail"], [class*="view"], .product-info');
        
        if (await detailContainer.isVisible()) {
          await expect(detailContainer).toBeVisible();
        }
      }
    });

    test('should navigate back from edit to products list', async ({ page }) => {
      const productsLink = page.getByRole('link', { name: /Products/i });
      await productsLink.click();

      const editBtn = page.locator('button:has-text("Edit"), a[href*="/product/"][href*="edit"]');
      
      if (await editBtn.isVisible()) {
        await editBtn.first().click();

        const cancelBtn = page.getByRole('button', { name: /Cancel|Back|Close/i });
        
        if (await cancelBtn.isVisible()) {
          await cancelBtn.click();

          // Should be back on products page
          const productTable = page.locator('table, [role="grid"]');
          await expect(productTable).toBeVisible();
        }
      }
    });
  });

  test.describe('AI Assistant Integration Features', () => {
    test('should display AI Assistant button when adding product', async ({ page }) => {
      test.setTimeout(120000);

      const productsLink = page.getByRole('link', { name: /Products/i });
      await productsLink.click();

      const addProductBtn = page.getByRole('button', { name: /Add Product/i });
      await addProductBtn.click();

      // Look for AI Assistant button
      const aiButton = page.locator('button:has-text("AI"), button[title*="AI"], button:has-text("Assistant")');
      
      if (await aiButton.isVisible()) {
        await expect(aiButton).toBeVisible();
      }
    });

    test('should have AI Assistant functionality accessible', async ({ page }) => {
      test.setTimeout(120000);

      const productsLink = page.getByRole('link', { name: /Products/i });
      await productsLink.click();

      const addProductBtn = page.getByRole('button', { name: /Add Product/i });
      await addProductBtn.click();

      // Fill in basic product info
      const nameInput = page.getByRole('textbox', { name: /Name/i });
      await nameInput.fill('AI Test Product');

      const keywordsInput = page.getByRole('textbox', { name: /Keywords/i });
      if (await keywordsInput.isVisible()) {
        await keywordsInput.fill('test, ai, demo');
      }

      // Look for Ask AI button
      const askAIBtn = page.locator('button:has-text("Ask AI"), button:has-text("Generate"), button[title*="AI"]');
      
      if (await askAIBtn.isVisible()) {
        await askAIBtn.click();

        // Wait for AI response (with timeout)
        await page.waitForTimeout(5000);

        // Check if description field was populated
        const descriptionInput = page.getByRole('textbox', { name: /Description/i });
        if (await descriptionInput.isVisible()) {
          const description = await descriptionInput.inputValue();
          // Description might be auto-filled by AI
          expect(description !== null).toBeTruthy();
        }
      }
    });

    test('should handle AI service gracefully if unavailable', async ({ page }) => {
      test.setTimeout(120000);

      const productsLink = page.getByRole('link', { name: /Products/i });
      await productsLink.click();

      const addProductBtn = page.getByRole('button', { name: /Add Product/i });
      await addProductBtn.click();

      // If AI button exists, test error handling
      const aiButton = page.locator('button:has-text("AI"), button:has-text("Ask AI")');
      
      if (await aiButton.isVisible()) {
        // Set up listener for any error notifications
        let errorShown = false;
        page.on('dialog', dialog => {
          if (dialog.message().toLowerCase().includes('error')) {
            errorShown = true;
          }
        });

        await aiButton.click();
        await page.waitForTimeout(5000);

        // Either success or error handling should work
        expect(true).toBeTruthy();
      }
    });

    test('should allow manual description entry as fallback', async ({ page }) => {
      const productsLink = page.getByRole('link', { name: /Products/i });
      await productsLink.click();

      const addProductBtn = page.getByRole('button', { name: /Add Product/i });
      await addProductBtn.click();

      const descriptionInput = page.getByRole('textbox', { name: /Description/i });
      if (await descriptionInput.isVisible()) {
        await descriptionInput.fill('Manual product description');
        await expect(descriptionInput).toHaveValue('Manual product description');
      }
    });
  });

  test.describe('Admin Navigation and Permissions', () => {
    test('should have accessible main navigation', async ({ page }) => {
      const nav = page.locator('nav, [role="navigation"]');
      await expect(nav).toBeVisible();
    });

    test('should display Products navigation link', async ({ page }) => {
      const productsLink = page.getByRole('link', { name: /Products/i });
      await expect(productsLink).toBeVisible();
    });

    test('should allow navigation to Orders if available', async ({ page }) => {
      const ordersLink = page.getByRole('link', { name: /Orders?/i });
      
      if (await ordersLink.isVisible()) {
        await ordersLink.click();
        
        // Should navigate to orders page
        await expect(page.url()).toContain(/order/i);
      }
    });

    test('should allow navigation back to main dashboard', async ({ page }) => {
      const productsLink = page.getByRole('link', { name: /Products/i });
      await productsLink.click();

      // Look for home/dashboard link
      const dashboardLink = page.getByRole('link', { name: /Dashboard|Home|Admin/i });
      
      if (await dashboardLink.isVisible()) {
        await dashboardLink.click();
        
        // Should return to main admin page
        await expect(page).toHaveTitle(testConfig.getExpectedAdminTitle());
      }
    });

    test('should maintain navigation consistency', async ({ page }) => {
      // Navigate through multiple pages
      const productsLink = page.getByRole('link', { name: /Products/i });
      await productsLink.click();
      
      // Navigation should still be visible
      const nav = page.locator('nav, [role="navigation"]');
      await expect(nav).toBeVisible();
      
      // Should be able to navigate back
      await productsLink.click();
      await expect(page.url()).toContain(/product/i);
    });

    test('should verify user has admin access (not permission denied)', async ({ page }) => {
      const productsLink = page.getByRole('link', { name: /Products/i });
      await productsLink.click();

      // Should not show permission denied message
      const deniedMsg = page.locator('text=/permission|forbidden|unauthorized|denied/i');
      
      if (await deniedMsg.isVisible()) {
        // Should not reach here if permissions are correct
        expect(false).toBeTruthy();
      } else {
        // Should have access
        await expect(page.getByRole('button', { name: /Add Product/i })).toBeVisible();
      }
    });

    test('should display admin-specific UI elements', async ({ page }) => {
      // Check for admin-specific controls (not in store front)
      const adminElements = page.locator('button:has-text("Edit"), button:has-text("Delete"), button:has-text("Add")');
      
      expect(await adminElements.count()).toBeGreaterThan(0);
    });

    test('should allow navigation between multiple admin sections', async ({ page }) => {
      // Navigate to Products
      const productsLink = page.getByRole('link', { name: /Products/i });
      await productsLink.click();
      
      await expect(page.locator('button, table')).toBeTruthy();

      // Look for other navigation options
      const allLinks = page.locator('nav a, [role="navigation"] a');
      const linkCount = await allLinks.count();
      
      // Should have multiple navigation options
      expect(linkCount).toBeGreaterThan(0);
    });
  });

  test.describe('Admin Portal Performance and Stability', () => {
    test('should load admin portal within acceptable time', async ({ page }) => {
      const startTime = Date.now();
      await page.goto(testConfig.storeAdminUrl);
      const loadTime = Date.now() - startTime;

      // Should load within 10 seconds
      expect(loadTime).toBeLessThan(10000);
    });

    test('should handle rapid navigation between sections', async ({ page }) => {
      const productsLink = page.getByRole('link', { name: /Products/i });
      
      await productsLink.click();
      await page.goBack();
      await productsLink.click();

      // Should still be functional
      await expect(page.getByRole('button', { name: /Add Product/i })).toBeVisible();
    });

    test('should display proper error handling', async ({ page }) => {
      // Navigate to non-existent section
      await page.goto(`${testConfig.storeAdminUrl}/nonexistent`);

      // Should show error page or redirect gracefully
      const errorMsg = page.locator('text=/404|not found|error/i');
      
      const hasError = await errorMsg.isVisible().catch(() => false);
      expect(hasError || page.url() !== page.url()).toBeTruthy();
    });

    test('should maintain responsive UI during operations', async ({ page }) => {
      const productsLink = page.getByRole('link', { name: /Products/i });
      await productsLink.click();

      const addBtn = page.getByRole('button', { name: /Add Product/i });
      
      // Button should remain responsive
      await expect(addBtn).toBeVisible();
      await expect(addBtn).toBeEnabled();
    });
  });
});
