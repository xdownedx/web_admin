# Используйте официальный образ Python
FROM python:3.8-slim

# Установите рабочую директорию в /app
WORKDIR /app

# Установите переменные окружения
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1
ENV PORT=8006

# Установите зависимости
RUN pip install --upgrade pip
COPY ./requirements.txt /app/requirements.txt
RUN pip instaldl -r requirements.txt

# Копируйте проект
COPY . /app/
