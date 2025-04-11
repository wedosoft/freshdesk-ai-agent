import boto3
import os
from typing import List, Dict, Any
from sentence_transformers import SentenceTransformer
import numpy as np
import uuid
from datetime import datetime

# DynamoDB 클라이언트 초기화
dynamodb = boto3.resource('dynamodb')
faq_table = dynamodb.Table(os.environ['DYNAMODB_FAQ_TABLE'])

# 문장 임베딩 모델 초기화
model = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')

def calculate_similarity(query: str, text: str) -> float:
    """
    두 텍스트 간의 유사도를 계산
    """
    query_embedding = model.encode([query])[0]
    text_embedding = model.encode([text])[0]
    return float(np.dot(query_embedding, text_embedding))

async def search_faq(query: str, threshold: float = 0.7) -> List[Dict[str, Any]]:
    """
    FAQ 데이터베이스에서 관련 답변을 검색
    
    Args:
        query: 검색 쿼리
        threshold: 유사도 임계값 (0.0 ~ 1.0)
    
    Returns:
        관련 FAQ 목록
    """
    try:
        # FAQ 데이터베이스에서 모든 항목 가져오기
        response = faq_table.scan()
        faqs = response.get('Items', [])
        
        # 검색 결과 저장
        results = []
        
        for faq in faqs:
            # 질문과 답변의 유사도 계산
            question_similarity = calculate_similarity(query, faq['question'])
            answer_similarity = calculate_similarity(query, faq['answer'])
            
            # 최대 유사도 사용
            similarity = max(question_similarity, answer_similarity)
            
            # 임계값 이상인 경우 결과에 추가
            if similarity >= threshold:
                results.append({
                    'id': faq['id'],
                    'question': faq['question'],
                    'answer': faq['answer'],
                    'category': faq['category'],
                    'similarity': similarity
                })
        
        # 유사도 기준으로 정렬
        results.sort(key=lambda x: x['similarity'], reverse=True)
        
        return results[:5]  # 상위 5개 결과만 반환
        
    except Exception as e:
        print(f"FAQ 검색 중 오류 발생: {str(e)}")
        return []

async def add_faq(question: str, answer: str, category: str) -> Dict[str, Any]:
    """
    새로운 FAQ 항목 추가
    
    Args:
        question: FAQ 질문
        answer: FAQ 답변
        category: FAQ 카테고리
    
    Returns:
        생성된 FAQ 항목
    """
    try:
        # 새로운 FAQ 항목 생성
        faq = {
            'id': str(uuid.uuid4()),
            'question': question,
            'answer': answer,
            'category': category,
            'created_at': datetime.now().isoformat()
        }
        
        # DynamoDB에 저장
        faq_table.put_item(Item=faq)
        
        return faq
        
    except Exception as e:
        print(f"FAQ 추가 중 오류 발생: {str(e)}")
        raise 