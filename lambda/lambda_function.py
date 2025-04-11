import json
import os
from typing import Dict, Any
from aws_lambda_powertools import Logger, Tracer
from aws_lambda_powertools.utilities.typing import LambdaContext

from faq_search import search_faq
from ticket_search import search_similar_tickets, store_ticket
from sentiment_analysis import analyze_sentiment, determine_priority

# 로거와 트레이서 초기화
logger = Logger()
tracer = Tracer()

@tracer.capture_method
async def process_freshdesk_webhook(event: Dict[str, Any]) -> Dict[str, Any]:
    """
    Freshdesk 웹훅 이벤트를 처리하는 함수
    """
    try:
        # 웹훅 데이터 파싱
        webhook_data = json.loads(event['body'])
        ticket_id = webhook_data.get('ticket_id')
        ticket_content = webhook_data.get('content')
        ticket_subject = webhook_data.get('subject', '')
        
        # 티켓 데이터 저장
        ticket_data = {
            'ticket_id': ticket_id,
            'subject': ticket_subject,
            'description': ticket_content,
            'status': 'open'
        }
        await store_ticket(ticket_data)
        
        # FAQ 검색
        faq_response = await search_faq(ticket_content)
        
        # 유사 티켓 검색
        similar_tickets = await search_similar_tickets(ticket_content)
        
        # 감정 분석
        sentiment_result = analyze_sentiment(ticket_content)
        priority = determine_priority(sentiment_result)
        
        # 응답 생성
        response = {
            'ticket_id': ticket_id,
            'faq_suggestions': faq_response,
            'similar_tickets': similar_tickets,
            'sentiment': sentiment_result['sentiment'],
            'sentiment_score': sentiment_result['score'],
            'sentiment_confidence': sentiment_result['confidence'],
            'priority': priority
        }
        
        return {
            'statusCode': 200,
            'body': json.dumps(response)
        }
    except Exception as e:
        logger.exception("웹훅 처리 중 오류 발생")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }

@logger.inject_lambda_context
@tracer.capture_lambda_handler
async def lambda_handler(event: Dict[str, Any], context: LambdaContext) -> Dict[str, Any]:
    """
    Lambda 함수의 메인 핸들러
    """
    logger.info("Lambda 함수 실행 시작")
    return await process_freshdesk_webhook(event) 