from typing import Dict, Any
from transformers import pipeline
import re

# 감정 분석 파이프라인 초기화
sentiment_analyzer = pipeline(
    "sentiment-analysis",
    model="nlptown/bert-base-multilingual-uncased-sentiment",
    tokenizer="nlptown/bert-base-multilingual-uncased-sentiment"
)

def clean_text(text: str) -> str:
    """
    텍스트를 정제하여 감정 분석에 적합하게 만듦
    """
    # 특수 문자 제거
    text = re.sub(r'[^\w\s]', ' ', text)
    # 연속된 공백 제거
    text = re.sub(r'\s+', ' ', text)
    # 앞뒤 공백 제거
    text = text.strip()
    return text

def analyze_sentiment(text: str) -> Dict[str, Any]:
    """
    텍스트의 감정을 분석
    
    Args:
        text: 분석할 텍스트
    
    Returns:
        감정 분석 결과
    """
    try:
        # 텍스트 정제
        cleaned_text = clean_text(text)
        
        # 감정 분석 실행
        result = sentiment_analyzer(cleaned_text)[0]
        
        # 점수를 긍정/중립/부정으로 변환
        score = float(result['label'].split()[0])
        if score >= 4:
            sentiment = "positive"
        elif score >= 2:
            sentiment = "neutral"
        else:
            sentiment = "negative"
        
        return {
            'sentiment': sentiment,
            'score': score,
            'confidence': result['score']
        }
        
    except Exception as e:
        print(f"감정 분석 중 오류 발생: {str(e)}")
        return {
            'sentiment': 'neutral',
            'score': 3.0,
            'confidence': 0.0
        }

def determine_priority(sentiment_result: Dict[str, Any]) -> str:
    """
    감정 분석 결과를 기반으로 우선순위를 결정
    
    Args:
        sentiment_result: 감정 분석 결과
    
    Returns:
        우선순위 (low/medium/high)
    """
    sentiment = sentiment_result['sentiment']
    confidence = sentiment_result['confidence']
    
    # 신뢰도가 낮은 경우 중간 우선순위 반환
    if confidence < 0.6:
        return "medium"
    
    # 감정에 따른 우선순위 결정
    if sentiment == "positive":
        return "low"
    elif sentiment == "neutral":
        return "medium"
    else:  # negative
        return "high" 