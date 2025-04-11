import boto3
import os
from typing import List, Dict, Any
from sentence_transformers import SentenceTransformer
import numpy as np
from datetime import datetime, timedelta

# DynamoDB 클라이언트 초기화
dynamodb = boto3.resource('dynamodb')
tickets_table = dynamodb.Table(os.environ['DYNAMODB_TICKETS_TABLE'])

# 문장 임베딩 모델 초기화
model = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')

def calculate_ticket_similarity(query: str, ticket: Dict[str, Any]) -> float:
    """
    쿼리와 티켓 간의 유사도를 계산
    """
    # 티켓의 제목과 내용을 결합하여 유사도 계산
    ticket_text = f"{ticket.get('subject', '')} {ticket.get('description', '')}"
    query_embedding = model.encode([query])[0]
    ticket_embedding = model.encode([ticket_text])[0]
    return float(np.dot(query_embedding, ticket_embedding))

async def search_similar_tickets(
    query: str,
    threshold: float = 0.6,
    time_window: int = 30  # 일 단위
) -> List[Dict[str, Any]]:
    """
    유사한 이전 티켓을 검색
    
    Args:
        query: 검색 쿼리
        threshold: 유사도 임계값 (0.0 ~ 1.0)
        time_window: 검색할 기간 (일)
    
    Returns:
        유사한 티켓 목록
    """
    try:
        # 시간 범위 계산
        end_date = datetime.now()
        start_date = end_date - timedelta(days=time_window)
        
        # DynamoDB 쿼리
        response = tickets_table.query(
            KeyConditionExpression='created_at BETWEEN :start AND :end',
            ExpressionAttributeValues={
                ':start': start_date.isoformat(),
                ':end': end_date.isoformat()
            }
        )
        
        tickets = response.get('Items', [])
        
        # 검색 결과 저장
        results = []
        
        for ticket in tickets:
            similarity = calculate_ticket_similarity(query, ticket)
            
            if similarity >= threshold:
                results.append({
                    'ticket_id': ticket['ticket_id'],
                    'subject': ticket.get('subject', ''),
                    'description': ticket.get('description', ''),
                    'status': ticket.get('status', ''),
                    'priority': ticket.get('priority', ''),
                    'similarity': similarity
                })
        
        # 유사도 기준으로 정렬
        results.sort(key=lambda x: x['similarity'], reverse=True)
        
        return results[:5]  # 상위 5개 결과만 반환
        
    except Exception as e:
        print(f"유사 티켓 검색 중 오류 발생: {str(e)}")
        return []

async def store_ticket(ticket_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    새로운 티켓을 데이터베이스에 저장
    
    Args:
        ticket_data: 티켓 데이터
    
    Returns:
        저장된 티켓 데이터
    """
    try:
        # 티켓 데이터에 타임스탬프 추가
        ticket_data['created_at'] = datetime.now().isoformat()
        
        # DynamoDB에 저장
        tickets_table.put_item(Item=ticket_data)
        
        return ticket_data
        
    except Exception as e:
        print(f"티켓 저장 중 오류 발생: {str(e)}")
        raise 