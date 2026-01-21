# Use the official Python image as the base image
FROM python:3.12.7-alpine

# Set security-related build arguments
ARG APP_VERSION=0.1.0
ARG APP_USER=appuser
ARG APP_UID=1000

# Create a non-root user for running the application
RUN addgroup -g ${APP_UID} ${APP_USER} && \
    adduser -D -u ${APP_UID} -G ${APP_USER} ${APP_USER}

# Set the working directory to /app
WORKDIR /app

# Copy the requirements file into the container
COPY requirements.txt .

# Install the dependencies with no cache to reduce image size
RUN pip install --no-cache-dir -r requirements.txt && \
    pip install --no-cache-dir gunicorn

# Copy the rest of the application code into the container
COPY --chown=${APP_UID}:${APP_UID} . .

# Change to non-root user
USER ${APP_USER}

# Expose port 5001 for the FastAPI application
EXPOSE 5001

# Set the environment variable for the app version number
ENV APP_VERSION=$APP_VERSION

# Add health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:5001/docs')" || exit 1

# Start the FastAPI application with gunicorn for better production performance
CMD ["gunicorn", "main:app", "-w", "1", "-k", "uvicorn.workers.UvicornWorker", "--bind", "0.0.0.0:5001"]