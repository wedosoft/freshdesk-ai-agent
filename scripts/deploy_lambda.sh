#!/bin/bash

# 스크립트 실행 디렉토리로 이동
cd "$(dirname "$0")/.."

# Lambda 함수 디렉토리
LAMBDA_DIR="lambda"
DEPLOY_DIR="deploy"
ZIP_FILE="deployment.zip"

# 배포 디렉토리 생성 및 정리
rm -rf $DEPLOY_DIR
mkdir -p $DEPLOY_DIR

# 가상환경 생성 및 활성화
python -m venv venv
source venv/bin/activate

# 의존성 설치
pip install -r requirements.txt

# Lambda 함수 코드 복사
cp -r $LAMBDA_DIR/* $DEPLOY_DIR/

# 의존성 패키지 복사
cp -r venv/lib/python3.9/site-packages/* $DEPLOY_DIR/

# 배포 파일 압축
cd $DEPLOY_DIR
zip -r ../$ZIP_FILE .

# Lambda 함수 업데이트
aws lambda update-function-code \
    --function-name freshdesk-ai-agent \
    --zip-file fileb://../$ZIP_FILE

# 정리
cd ..
rm -rf $DEPLOY_DIR
rm $ZIP_FILE
deactivate
rm -rf venv

echo "Lambda 함수 배포가 완료되었습니다." 