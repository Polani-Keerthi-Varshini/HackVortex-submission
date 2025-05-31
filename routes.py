from flask import render_template, request, jsonify, flash, redirect, url_for
from app import app, db
from models import Claim, Report, TrendData, GeographicData
from fact_checker import FactChecker
from nlp_processor import NLPProcessor
import json
import logging

# Initialize components
fact_checker = FactChecker()
nlp_processor = NLPProcessor()

@app.route('/')
def index():
    """Landing page"""
    return render_template('index.html')

@app.route('/fact-check', methods=['GET', 'POST'])
def fact_check():
    """Fact-checking interface"""
    if request.method == 'POST':
        claim_text = request.form.get('claim_text', '').strip()
        
        if not claim_text:
            flash('Please enter a claim to fact-check.', 'warning')
            return render_template('fact_check.html')
        
        try:
            # Process the claim with NLP
            extracted_claims = nlp_processor.extract_claims(claim_text)
            
            # Get fact-check results
            results = fact_checker.verify_claim(claim_text)
            
            # Save to database
            claim = Claim(
                claim_text=claim_text,
                credibility_score=results.get('credibility_score', 0.0),
                status=results.get('status', 'pending'),
                sources=json.dumps(results.get('sources', [])),
                reasoning=results.get('reasoning', '')
            )
            db.session.add(claim)
            db.session.commit()
            
            # Update trends
            update_trend_data(results.get('category', 'general'), results.get('status', 'pending'))
            
            return render_template('fact_check.html', 
                                 claim=claim_text, 
                                 results=results,
                                 extracted_claims=extracted_claims)
            
        except Exception as e:
            logging.error(f"Error in fact-checking: {str(e)}")
            flash('An error occurred while fact-checking. Please try again.', 'danger')
            return render_template('fact_check.html')
    
    return render_template('fact_check.html')

@app.route('/dashboard')
def dashboard():
    """Evidence dashboard showing recent claims and statistics"""
    recent_claims = Claim.query.order_by(Claim.created_at.desc()).limit(10).all()
    
    # Calculate statistics
    total_claims = Claim.query.count()
    verified_claims = Claim.query.filter_by(status='verified').count()
    false_claims = Claim.query.filter_by(status='false').count()
    mixed_claims = Claim.query.filter_by(status='mixed').count()
    
    stats = {
        'total_claims': total_claims,
        'verified_claims': verified_claims,
        'false_claims': false_claims,
        'mixed_claims': mixed_claims,
        'accuracy_rate': round((verified_claims / max(total_claims, 1)) * 100, 2)
    }
    
    return render_template('dashboard.html', claims=recent_claims, stats=stats)

@app.route('/trends')
def trends():
    """Trend analysis and misinformation heatmap"""
    trend_data = TrendData.query.order_by(TrendData.date_recorded.desc()).limit(50).all()
    
    # Aggregate data by category
    category_stats = {}
    for trend in trend_data:
        if trend.category not in category_stats:
            category_stats[trend.category] = {
                'total_claims': 0,
                'false_claims': 0,
                'false_rate': 0
            }
        category_stats[trend.category]['total_claims'] += (trend.claim_count or 0)
        category_stats[trend.category]['false_claims'] += (trend.false_claim_count or 0)
    
    # Calculate false rates
    for category in category_stats:
        total = category_stats[category]['total_claims']
        false = category_stats[category]['false_claims']
        category_stats[category]['false_rate'] = round((false / max(total, 1)) * 100, 2)
    
    return render_template('trends.html', trend_data=trend_data, category_stats=category_stats)

@app.route('/search', methods=['GET', 'POST'])
def search():
    """Fact-check search engine"""
    query = None
    category = None
    credibility = None
    results = []
    
    if request.method == 'POST':
        query = request.form.get('query', '').strip()
        category = request.form.get('category', '')
        credibility = request.form.get('credibility', '')
        
        if query:
            try:
                # Build search query
                search_query = Claim.query
                
                # Text search in claim_text and reasoning
                search_query = search_query.filter(
                    db.or_(
                        Claim.claim_text.ilike(f'%{query}%'),
                        Claim.reasoning.ilike(f'%{query}%')
                    )
                )
                
                # Category filter
                if category:
                    # Extract category from sources (stored as JSON string)
                    search_query = search_query.filter(Claim.sources.ilike(f'%{category}%'))
                
                # Credibility filter
                if credibility == 'high':
                    search_query = search_query.filter(Claim.credibility_score >= 8.0)
                elif credibility == 'medium':
                    search_query = search_query.filter(
                        Claim.credibility_score >= 4.0,
                        Claim.credibility_score < 8.0
                    )
                elif credibility == 'low':
                    search_query = search_query.filter(Claim.credibility_score < 4.0)
                
                # Get results ordered by relevance (credibility score desc)
                results = search_query.order_by(Claim.credibility_score.desc()).limit(20).all()
                
                # Add additional properties for display
                for result in results:
                    try:
                        result.sources_list = json.loads(result.sources) if result.sources else []
                    except:
                        result.sources_list = []
                    
                    # Determine risk level for display
                    if result.credibility_score >= 7:
                        result.risk_level = 'low'
                    elif result.credibility_score >= 4:
                        result.risk_level = 'medium'
                    else:
                        result.risk_level = 'high'
                        
            except Exception as e:
                flash(f'Search error: {str(e)}', 'error')
    
    return render_template('search.html', 
                         query=query, 
                         category=category,
                         credibility=credibility,
                         results=results)

@app.route('/social-media-check', methods=['POST'])
def social_media_check():
    """Social media fact-checking endpoint"""
    social_content = request.form.get('social_content', '').strip()
    
    if not social_content:
        flash('Please provide social media content to fact-check.', 'error')
        return redirect(url_for('search'))
    
    try:
        # Extract text from social media URL or use direct text
        if social_content.startswith('http'):
            # For now, treat URLs as text content
            # In production, you'd integrate with social media APIs
            extracted_text = f"Social media post from: {social_content}"
        else:
            extracted_text = social_content
        
        # Use NLP processor to extract claims
        nlp_processor = NLPProcessor()
        claims = nlp_processor.extract_claims(extracted_text)
        
        if claims:
            # Fact-check the most significant claim
            main_claim = max(claims, key=lambda x: x.get('confidence', 0))
            fact_checker = FactChecker()
            results = fact_checker.verify_claim(main_claim['text'])
            
            # Store the result
            new_claim = Claim(
                claim_text=main_claim['text'],
                credibility_score=results['credibility_score'],
                status=results['status'],
                sources=json.dumps(results.get('sources', [])),
                reasoning=results['reasoning']
            )
            
            db.session.add(new_claim)
            db.session.commit()
            
            flash(f'Social media content fact-checked! Credibility score: {results["credibility_score"]:.1f}/10', 'success')
            return redirect(url_for('fact_check'))
        else:
            flash('No factual claims detected in the social media content.', 'info')
            
    except Exception as e:
        flash(f'Error processing social media content: {str(e)}', 'error')
    
    return redirect(url_for('search'))

@app.route('/report', methods=['GET', 'POST'])
def report():
    """User reporting system for suspicious content"""
    if request.method == 'POST':
        content_text = request.form.get('content_text', '').strip()
        content_url = request.form.get('content_url', '').strip()
        reporter_email = request.form.get('reporter_email', '').strip()
        category = request.form.get('category', 'general')
        
        if not content_text:
            flash('Please provide the suspicious content text.', 'warning')
            return render_template('report.html')
        
        try:
            # Create new report
            report = Report(
                content_text=content_text,
                content_url=content_url if content_url else None,
                reporter_email=reporter_email if reporter_email else None,
                category=category,
                priority='medium',
                status='pending'
            )
            db.session.add(report)
            db.session.commit()
            
            flash('Thank you for your report. We will review it shortly.', 'success')
            return redirect(url_for('report'))
            
        except Exception as e:
            logging.error(f"Error saving report: {str(e)}")
            flash('An error occurred while submitting your report. Please try again.', 'danger')
    
    return render_template('report.html')

# API Endpoints

@app.route('/api/fact-check', methods=['POST'])
def api_fact_check():
    """API endpoint for fact-checking claims"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Missing request data'}), 400
        
        # Support both 'claim' and 'content' fields for compatibility
        claim_text = data.get('claim') or data.get('content', '').strip()
        if not claim_text:
            return jsonify({'error': 'Missing claim or content text'}), 400
        
        # Process the claim
        fact_check_result = fact_checker.verify_claim(claim_text)
        
        # Save to database
        claim = Claim(
            claim_text=claim_text,
            credibility_score=fact_check_result.get('credibility_score', 0.0),
            status=fact_check_result.get('status', 'pending'),
            sources=json.dumps(fact_check_result.get('sources', [])),
            reasoning=fact_check_result.get('reasoning', '')
        )
        db.session.add(claim)
        db.session.commit()
        
        # Format response for browser extension compatibility
        return jsonify({
            'success': True,
            'results': [fact_check_result]
        })
        
    except Exception as e:
        logging.error(f"API fact-check error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/fact-check/<int:claim_id>')
def api_get_claim(claim_id):
    """API endpoint to retrieve fact-check results"""
    claim = Claim.query.get_or_404(claim_id)
    return jsonify(claim.to_dict())

@app.route('/api/report', methods=['POST'])
def api_report():
    """API endpoint for reporting suspicious content"""
    try:
        data = request.get_json()
        if not data or 'content' not in data:
            return jsonify({'error': 'Missing content text'}), 400
        
        report = Report(
            content_text=data['content'],
            content_url=data.get('url'),
            reporter_email=data.get('email'),
            category=data.get('category', 'general')
        )
        db.session.add(report)
        db.session.commit()
        
        return jsonify({
            'report_id': report.id,
            'status': 'submitted'
        })
        
    except Exception as e:
        logging.error(f"API report error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/trends')
def api_trends():
    """API endpoint for trending misinformation topics"""
    trends = TrendData.query.order_by(TrendData.date_recorded.desc()).limit(20).all()
    return jsonify([trend.to_dict() for trend in trends])

def update_trend_data(category, status):
    """Update trend data for analytics"""
    try:
        from datetime import date
        today = date.today()
        
        # Find or create trend record for today and category
        trend = TrendData.query.filter_by(
            category=category,
            date_recorded=today
        ).first()
        
        if not trend:
            trend = TrendData(category=category, date_recorded=today, claim_count=0, false_claim_count=0)
            db.session.add(trend)
        
        # Update counts
        if trend.claim_count is None:
            trend.claim_count = 0
        if trend.false_claim_count is None:
            trend.false_claim_count = 0
            
        trend.claim_count += 1
        if status == 'false':
            trend.false_claim_count += 1
        
        db.session.commit()
        
    except Exception as e:
        logging.error(f"Error updating trend data: {str(e)}")



@app.errorhandler(404)
def not_found(error):
    return render_template('base.html', 
                         title="Page Not Found",
                         content="<h1>404 - Page Not Found</h1><p>The page you're looking for doesn't exist.</p>"), 404

@app.errorhandler(500)
def internal_error(error):
    return render_template('base.html', 
                         title="Internal Error",
                         content="<h1>500 - Internal Server Error</h1><p>Something went wrong. Please try again later.</p>"), 500
