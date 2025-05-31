from app import db
from datetime import datetime
from sqlalchemy import Text, DateTime, Float, Integer, String, Boolean

class Claim(db.Model):
    """Model for storing claims and their fact-check results"""
    id = db.Column(db.Integer, primary_key=True)
    claim_text = db.Column(Text, nullable=False)
    credibility_score = db.Column(Float, default=0.0)
    status = db.Column(String(20), default='pending')  
    sources = db.Column(Text)  
    reasoning = db.Column(Text)
    created_at = db.Column(DateTime, default=datetime.utcnow)
    updated_at = db.Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'claim_text': self.claim_text,
            'credibility_score': self.credibility_score,
            'status': self.status,
            'sources': self.sources,
            'reasoning': self.reasoning,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class Report(db.Model):
    """Model for user-reported suspicious content"""
    id = db.Column(db.Integer, primary_key=True)
    content_text = db.Column(Text, nullable=False)
    content_url = db.Column(String(500))
    reporter_email = db.Column(String(120))
    category = db.Column(String(50))  # e.g., health, politics, environment
    priority = db.Column(String(20), default='medium')  # low, medium, high
    status = db.Column(String(20), default='pending')  # pending, reviewed, verified, dismissed
    notes = db.Column(Text)
    created_at = db.Column(DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'content_text': self.content_text,
            'content_url': self.content_url,
            'reporter_email': self.reporter_email,
            'category': self.category,
            'priority': self.priority,
            'status': self.status,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class TrendData(db.Model):
    """Model for tracking misinformation trends"""
    id = db.Column(db.Integer, primary_key=True)
    category = db.Column(String(50), nullable=False)
    claim_count = db.Column(Integer, default=0)
    false_claim_count = db.Column(Integer, default=0)
    date_recorded = db.Column(DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'category': self.category,
            'claim_count': self.claim_count,
            'false_claim_count': self.false_claim_count,
            'false_rate': round((self.false_claim_count / max(self.claim_count, 1)) * 100, 2),
            'date_recorded': self.date_recorded.isoformat() if self.date_recorded else None
        }

class GeographicData(db.Model):
    """Model for tracking misinformation by geographic location"""
    id = db.Column(db.Integer, primary_key=True)
    country = db.Column(String(100), nullable=False)
    region = db.Column(String(100))  
    city = db.Column(String(100))
    latitude = db.Column(Float)
    longitude = db.Column(Float)
    claim_count = db.Column(Integer, default=0)
    false_claim_count = db.Column(Integer, default=0)
    category = db.Column(String(50), nullable=False)
    date_recorded = db.Column(DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'country': self.country,
            'region': self.region,
            'city': self.city,
            'latitude': self.latitude,
            'longitude': self.longitude,
            'claim_count': self.claim_count,
            'false_claim_count': self.false_claim_count,
            'category': self.category,
            'false_rate': round((self.false_claim_count / max(self.claim_count, 1)) * 100, 2),
            'date_recorded': self.date_recorded.isoformat() if self.date_recorded else None
        }
