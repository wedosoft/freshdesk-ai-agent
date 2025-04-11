#!/bin/bash

# 스크립트 실행 디렉토리로 이동
cd "$(dirname "$0")/.."

# 패키지 디렉토리 생성
PACKAGE_DIR="package"
rm -rf $PACKAGE_DIR
mkdir -p $PACKAGE_DIR

# 앱 파일 복사
cp -r frontend/* $PACKAGE_DIR/

# 앱 패키징
cd $PACKAGE_DIR
zip -r ../freshdesk-ai-agent-app.zip .

# 정리
cd ..
rm -rf $PACKAGE_DIR

echo "Freshdesk Custom App 패키징이 완료되었습니다."
echo "생성된 패키지: freshdesk-ai-agent-app.zip"
echo "이 파일을 Freshdesk 개발자 포털에서 업로드하세요." 