OUT_DIR=../../TODO-online

all:
	cnpm run build

run:
	-cnpm run serve

dist: all
	$(DO_SYNC_PUBLISH)
	cp -rf ./dist/* $(OUT_DIR)

.PHONY: dist

PUBLISH_DEP=dist
include ../java/tool/publish.mak

