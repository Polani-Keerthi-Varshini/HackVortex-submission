import spacy
import logging
from typing import List, Dict, Any

class NLPProcessor:
    """Handles NLP processing for claim extraction and analysis"""
    
    def __init__(self):
        try:
            # Try to load the English model
            self.nlp = spacy.load("en_core_web_sm")
        except OSError:
            # If model is not available, create a blank model
            logging.warning("spaCy English model not found. Using blank model.")
            self.nlp = spacy.blank("en")
        
        self.claim_indicators = [
            "according to", "study shows", "research indicates", "experts say",
            "it is reported", "sources claim", "allegedly", "reportedly",
            "evidence suggests", "data shows", "statistics reveal"
        ]
        
        self.factual_patterns = [
            "percent", "%", "million", "billion", "study", "research",
            "survey", "poll", "statistics", "data", "evidence"
        ]
    
    def extract_claims(self, text: str) -> List[Dict[str, Any]]:
        """Extract potential factual claims from text"""
        try:
            doc = self.nlp(text)
            claims = []
            
            # Split text into sentences
            sentences = [sent.text.strip() for sent in doc.sents]
            
            for i, sentence in enumerate(sentences):
                claim_info = self._analyze_sentence_for_claims(sentence, i)
                if claim_info:
                    claims.append(claim_info)
            
            # If no specific claims found, treat the entire text as a claim
            if not claims and text.strip():
                claims.append({
                    'text': text.strip(),
                    'sentence_index': 0,
                    'confidence': 0.5,
                    'type': 'general_claim',
                    'entities': self._extract_entities(text),
                    'has_factual_content': self._has_factual_content(text)
                })
            
            return claims
            
        except Exception as e:
            logging.error(f"Error in claim extraction: {str(e)}")
            return [{
                'text': text.strip(),
                'sentence_index': 0,
                'confidence': 0.3,
                'type': 'general_claim',
                'entities': [],
                'has_factual_content': False
            }]
    
    def _analyze_sentence_for_claims(self, sentence: str, index: int) -> Dict[str, Any]:
        """Analyze a sentence to determine if it contains factual claims"""
        sentence_lower = sentence.lower()
        
        # Check for claim indicators
        has_claim_indicator = any(indicator in sentence_lower for indicator in self.claim_indicators)
        
        # Check for factual content
        has_factual_content = self._has_factual_content(sentence)
        
        # Check for numbers or statistics
        has_numbers = any(char.isdigit() for char in sentence)
        
        # Calculate confidence score
        confidence = 0.0
        if has_claim_indicator:
            confidence += 0.4
        if has_factual_content:
            confidence += 0.3
        if has_numbers:
            confidence += 0.2
        if len(sentence.split()) > 10:  # Longer sentences might be more substantial
            confidence += 0.1
        
        # Only return if confidence is above threshold
        if confidence >= 0.3:
            return {
                'text': sentence.strip(),
                'sentence_index': index,
                'confidence': confidence,
                'type': self._classify_claim_type(sentence),
                'entities': self._extract_entities(sentence),
                'has_factual_content': has_factual_content,
                'has_claim_indicator': has_claim_indicator,
                'has_numbers': has_numbers
            }
        
        return None
    
    def _has_factual_content(self, text: str) -> bool:
        """Check if text contains factual patterns"""
        text_lower = text.lower()
        return any(pattern in text_lower for pattern in self.factual_patterns)
    
    def _classify_claim_type(self, sentence: str) -> str:
        """Classify the type of claim"""
        sentence_lower = sentence.lower()
        
        if any(word in sentence_lower for word in ['study', 'research', 'survey']):
            return 'research_claim'
        elif any(word in sentence_lower for word in ['percent', '%', 'statistics', 'data']):
            return 'statistical_claim'
        elif any(word in sentence_lower for word in ['doctor', 'expert', 'scientist']):
            return 'expert_claim'
        elif any(word in sentence_lower for word in ['according to', 'sources say']):
            return 'attributed_claim'
        else:
            return 'general_claim'
    
    def _extract_entities(self, text: str) -> List[Dict[str, str]]:
        """Extract named entities from text"""
        try:
            doc = self.nlp(text)
            entities = []
            
            for ent in doc.ents:
                entities.append({
                    'text': ent.text,
                    'label': ent.label_,
                    'description': spacy.explain(ent.label_) or ent.label_
                })
            
            return entities
            
        except Exception as e:
            logging.error(f"Error extracting entities: {str(e)}")
            return []
    
    def analyze_text_quality(self, text: str) -> Dict[str, Any]:
        """Analyze text quality and characteristics"""
        try:
            doc = self.nlp(text)
            
            # Basic statistics
            word_count = len([token for token in doc if not token.is_space])
            sentence_count = len(list(doc.sents))
            
            # Calculate readability indicators
            avg_sentence_length = word_count / max(sentence_count, 1)
            
            # Check for various quality indicators
            has_proper_nouns = any(token.pos_ == "PROPN" for token in doc)
            has_numbers = any(token.like_num for token in doc)
            has_urls = any("http" in token.text.lower() or "www." in token.text.lower() for token in doc)
            
            return {
                'word_count': word_count,
                'sentence_count': sentence_count,
                'avg_sentence_length': round(avg_sentence_length, 2),
                'has_proper_nouns': has_proper_nouns,
                'has_numbers': has_numbers,
                'has_urls': has_urls,
                'complexity_score': min(avg_sentence_length / 15, 1.0)  # Normalized complexity
            }
            
        except Exception as e:
            logging.error(f"Error analyzing text quality: {str(e)}")
            return {
                'word_count': len(text.split()),
                'sentence_count': 1,
                'avg_sentence_length': len(text.split()),
                'has_proper_nouns': False,
                'has_numbers': any(char.isdigit() for char in text),
                'has_urls': 'http' in text.lower(),
                'complexity_score': 0.5
            }
    
    def extract_keywords(self, text: str, max_keywords: int = 10) -> List[str]:
        """Extract important keywords from text"""
        try:
            doc = self.nlp(text)
            
            # Extract meaningful tokens (excluding stop words, punctuation, spaces)
            keywords = []
            for token in doc:
                if (not token.is_stop and 
                    not token.is_punct and 
                    not token.is_space and 
                    len(token.text) > 2 and
                    token.pos_ in ['NOUN', 'PROPN', 'ADJ', 'VERB']):
                    keywords.append(token.lemma_.lower())
            
            # Remove duplicates while preserving order
            seen = set()
            unique_keywords = []
            for keyword in keywords:
                if keyword not in seen:
                    seen.add(keyword)
                    unique_keywords.append(keyword)
            
            return unique_keywords[:max_keywords]
            
        except Exception as e:
            logging.error(f"Error extracting keywords: {str(e)}")
            # Fallback to simple word extraction
            words = text.lower().split()
            return [word for word in words if len(word) > 3][:max_keywords]
