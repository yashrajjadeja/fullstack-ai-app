# backend/Dockerfile
# Python 3.13 slim keeps the image small
FROM python:3.13-slim

WORKDIR /app

# Install dependencies first (Docker caches this layer unless requirements.txt changes)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the backend code
COPY . .

EXPOSE 5000

# In production use gunicorn. For development use: flask --app app run --host=0.0.0.0
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "app:app"]
