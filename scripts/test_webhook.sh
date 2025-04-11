#!/bin/bash

# API Gateway 엔드포인트
API_ENDPOINT="https://your-api-gateway-url.execute-api.ap-northeast-2.amazonaws.com/prod/webhook"

# 테스트 데이터
TEST_DATA='{
  "ticket_id": "12345",
  "subject": "서비스 이용 문의",
  "content": "안녕하세요. 서비스 이용 방법에 대해 문의드립니다. 현재 무료 체험 기간이 끝나서 유료 구독을 하고 싶은데, 어떤 요금제가 있는지 알려주세요. 감사합니다."
}'

# 웹훅 요청 보내기
curl -X POST \
  -H "Content-Type: application/json" \
  -d "$TEST_DATA" \
  $API_ENDPOINT

echo -e "\n웹훅 테스트가 완료되었습니다." 