# Freshdesk AI Agent

Freshdesk에 통합되는 AI 기반 고객 서비스 에이전트

## 주요 기능

- FAQ 기반 자동 응답
- 유사 티켓 기반 답변 추천
- 티켓 분류 및 우선순위 지정
- 감정 분석을 통한 고객 만족도 예측

## 기술 스택

- 백엔드: AWS Lambda + API Gateway
- 데이터베이스: DynamoDB
- LLM: Claude (Anthropic)
- 프론트엔드: Freshdesk Custom App

## 개발 환경 설정

### 필수 요구사항
- Python 3.9+
- AWS CLI
- Terraform
- Freshdesk 개발자 계정

### 설치 방법
```bash
# 프로젝트 클론
git clone [repository-url]

# 가상환경 생성 및 활성화
python -m venv venv
source venv/bin/activate  # Linux/Mac
# 또는
.\venv\Scripts\activate  # Windows

# 의존성 설치
pip install -r requirements.txt
```

## 프로젝트 구조
```
freshdesk-ai-agent/
├── terraform/           # AWS 인프라 코드
├── lambda/             # Lambda 함수 코드
├── frontend/           # Freshdesk Custom App
├── scripts/            # 유틸리티 스크립트
├── tests/              # 테스트 코드
├── requirements.txt    # Python 의존성
└── README.md
```

## 개발 가이드

### AWS 인프라 배포
```bash
cd terraform
terraform init
terraform plan
terraform apply
```

### 로컬 개발
```bash
# Lambda 함수 로컬 테스트
cd lambda
python -m pytest

# 프론트엔드 개발 서버 실행
cd frontend
npm install
npm run dev
```

## 라이센스
MIT License 