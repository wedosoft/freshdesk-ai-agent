import boto3
import json
import os
from typing import List, Dict, Any

# DynamoDB 클라이언트 초기화
dynamodb = boto3.resource('dynamodb')
faq_table = dynamodb.Table(os.environ['DYNAMODB_FAQ_TABLE'])

# 초기 FAQ 데이터
INITIAL_FAQS = [
    {
        "category": "계정",
        "question": "계정을 어떻게 생성하나요?",
        "answer": "홈페이지에서 '회원가입' 버튼을 클릭하고, 필요한 정보를 입력하시면 됩니다. 이메일 인증 후 계정이 활성화됩니다."
    },
    {
        "category": "계정",
        "question": "비밀번호를 잊어버렸어요",
        "answer": "로그인 페이지에서 '비밀번호 찾기'를 클릭하고, 등록된 이메일 주소를 입력하세요. 비밀번호 재설정 링크가 이메일로 발송됩니다."
    },
    {
        "category": "결제",
        "question": "요금제는 어떻게 되나요?",
        "answer": "저희 서비스는 무료 체험판, 기본, 프로, 엔터프라이즈 요금제를 제공합니다. 각 요금제의 상세 내용은 요금제 페이지에서 확인하실 수 있습니다."
    },
    {
        "category": "결제",
        "question": "결제 방법은 어떤 것이 있나요?",
        "answer": "신용카드, 체크카드, 계좌이체, 페이팔 등 다양한 결제 수단을 지원합니다. 결제는 매월 자동으로 이루어집니다."
    },
    {
        "category": "기능",
        "question": "데이터 백업은 어떻게 하나요?",
        "answer": "설정 > 데이터 관리 > 백업에서 수동 백업을 진행하실 수 있습니다. 또한 자동 백업은 매일 새벽 3시에 실행됩니다."
    },
    {
        "category": "기능",
        "question": "모바일 앱은 있나요?",
        "answer": "네, iOS와 Android 모두 지원합니다. 앱 스토어에서 '서비스명'을 검색하여 다운로드하실 수 있습니다."
    },
    {
        "category": "기술",
        "question": "시스템 요구사항은 어떻게 되나요?",
        "answer": "최신 버전의 Chrome, Firefox, Safari, Edge 브라우저를 지원합니다. 인터넷 연결이 필요하며, 권장 사양은 4GB 이상의 RAM입니다."
    },
    {
        "category": "기술",
        "question": "API는 제공되나요?",
        "answer": "네, RESTful API를 제공합니다. API 문서는 개발자 포털에서 확인하실 수 있으며, API 키는 계정 설정에서 발급받으실 수 있습니다."
    }
]

def init_faq_table() -> None:
    """
    FAQ 테이블을 초기화하고 기본 데이터를 추가
    """
    try:
        # 기존 데이터 삭제
        scan = faq_table.scan()
        with faq_table.batch_writer() as batch:
            for item in scan['Items']:
                batch.delete_item(
                    Key={
                        'id': item['id'],
                        'category': item['category']
                    }
                )
        
        # 새로운 데이터 추가
        with faq_table.batch_writer() as batch:
            for faq in INITIAL_FAQS:
                batch.put_item(Item=faq)
        
        print("FAQ 테이블 초기화가 완료되었습니다.")
        
    except Exception as e:
        print(f"FAQ 테이블 초기화 중 오류 발생: {str(e)}")
        raise

if __name__ == "__main__":
    init_faq_table() 