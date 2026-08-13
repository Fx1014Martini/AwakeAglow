# 醒醺 V6 小程序构建命令（与 package.json scripts 对应）
# 用法：make build / make test / make typecheck / make uno

.PHONY: build test typecheck uno dev

build:
	npm run build

test:
	npm run test

typecheck:
	npm run typecheck

uno:
	npm run uno

dev:
	npm run dev
