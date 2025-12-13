FROM python:3.12.3-alpine

WORKDIR /app

COPY requirements.txt .

RUN apk add --no-cache gcc musl-dev && rm -rf /var/lib/apt/lists/* && \
    pip install --no-cache-dir --upgrade pip && pip install --no-cache-dir -r requirements.txt && \
    adduser --disabled-password --gecos '' --no-create-home --shell /bin/false appuser && \
    chown -R appuser:appuser /app && chmod -R 755 /app

VOLUME ["/app/data"]

USER appuser

EXPOSE 8000

COPY . .

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]