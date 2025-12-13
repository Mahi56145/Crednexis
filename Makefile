SHELL := /bin/bash

.PHONY: up build test train

up:
	docker-compose up --build

build:
	docker-compose build

test:
	python -m pytest backend/tests

train:
	python backend/train_and_save.py
