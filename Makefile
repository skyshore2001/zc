# 改动了java并上线: make java
# 改动了h5后上线: make h5
# 全部编译上线: make

OUT_DIR=../TODO-online
MOD=h5 java

all: h5 java

$(MOD):
	@echo === make $@
	make -C $@ publish OUT_DIR=../$(OUT_DIR)

.PHONY: $(MOD)

DESIGN.html: DESIGN.md

filterDoc=perl doc/tool/filter-md-html.pl -linkFiles "doc/style.css,doc/doc.css,doc/doc.js"

%.html: %.md
	pandoc $< | $(filterDoc) > $@
