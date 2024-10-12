APP_NAME ?= torrent-box
SERVICE_NAME ?= $(APP_NAME).service
PORT ?= 8880
BIND_ADDRESS ?= 0.0.0.0
EXEC_START = $(shell which next)
EXEC_START += -p $(PORT) -H $(BIND_ADDRESS)

service:
	APP_NAME="$(APP_NAME)" EXEC_START="$(EXEC_START)" envsubst < service.tmpl > $(SERVICE_NAME)
install:
	mkdir -p $(DESTDIR)/etc/systemd/system
	cp $(SERVICE_NAME) $(DESTDIR)/etc/systemd/system/
