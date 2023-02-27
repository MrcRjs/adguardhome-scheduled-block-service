clean:
	-rm -r dist &> /dev/null
	-rm -r node_modules &> /dev/null

build-npm:
	npm install
	./node_modules/.bin/tsc

ROOT_DIR:=$(shell dirname $(realpath $(firstword $(MAKEFILE_LIST))))
build-linux:
	echo "#!/bin/bash" > dist/aghblock.sh
	echo "NODE_PATH=${ROOT_DIR}" >> dist/aghblock.sh
	echo "cd \$$NODE_PATH/dist" >> dist/aghblock.sh
	echo "NODE_PATH=\$$NODE_PATH node index.js \"\$$@\"" >> dist/aghblock.sh
	ln -f dist/aghblock.sh /usr/bin/aghblock
	chmod 750 /usr/bin/aghblock

install: clean build-npm build-linux
