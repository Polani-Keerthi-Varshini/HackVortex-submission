// TruthLens Main JavaScript

// Global utility functions
const TruthLens = {
    // Initialize the application
    init: function() {
        this.setupTooltips();
        this.setupAnimations();
        this.setupFormValidation();
        this.setupAjaxLoading();
    },

    // Setup Bootstrap tooltips
    setupTooltips: function() {
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });
    },

    // Setup page animations
    setupAnimations: function() {
        // Fade in cards on page load
        const cards = document.querySelectorAll('.card');
        cards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            setTimeout(() => {
                card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 100);
        });
    },

    // Setup form validation
    setupFormValidation: function() {
        const forms = document.querySelectorAll('.needs-validation');
        Array.prototype.slice.call(forms).forEach(function(form) {
            form.addEventListener('submit', function(event) {
                if (!form.checkValidity()) {
                    event.preventDefault();
                    event.stopPropagation();
                }
                form.classList.add('was-validated');
            }, false);
        });
    },

    // Setup AJAX loading indicators
    setupAjaxLoading: function() {
        // Show loading spinner for AJAX requests
        document.addEventListener('ajaxStart', function() {
            document.body.classList.add('loading');
        });

        document.addEventListener('ajaxComplete', function() {
            document.body.classList.remove('loading');
        });
    },

    // Utility function to show notifications
    showNotification: function(message, type = 'info') {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        const container = document.querySelector('.container');
        container.insertBefore(alertDiv, container.firstChild);

        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            if (alertDiv && alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, 5000);
    },

    // Format credibility score
    formatCredibilityScore: function(score) {
        return {
            value: parseFloat(score).toFixed(1),
            color: score >= 6 ? 'success' : score >= 4 ? 'warning' : 'danger',
            label: score >= 7.5 ? 'High' : score >= 5 ? 'Medium' : score >= 2.5 ? 'Low' : 'Very Low'
        };
    },

    // Get risk level styling
    getRiskLevel: function(score) {
        if (score >= 6) return { level: 'low', color: 'success', icon: 'check-circle' };
        if (score >= 4) return { level: 'medium', color: 'warning', icon: 'exclamation-triangle' };
        return { level: 'high', color: 'danger', icon: 'times-circle' };
    },

    // Copy text to clipboard
    copyToClipboard: function(text) {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(() => {
                this.showNotification('Copied to clipboard!', 'success');
            }).catch(() => {
                this.fallbackCopyToClipboard(text);
            });
        } else {
            this.fallbackCopyToClipboard(text);
        }
    },

    // Fallback copy method for older browsers
    fallbackCopyToClipboard: function(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
            document.execCommand('copy');
            this.showNotification('Copied to clipboard!', 'success');
        } catch (err) {
            this.showNotification('Failed to copy text', 'danger');
        }

        document.body.removeChild(textArea);
    },

    // Format date for display
    formatDate: function(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    },

    // Debounce function for search inputs
    debounce: function(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Validate URL format
    isValidUrl: function(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    },

    // Calculate reading time estimate
    calculateReadingTime: function(text) {
        const wordsPerMinute = 200;
        const words = text.split(/\s+/).length;
        const minutes = Math.ceil(words / wordsPerMinute);
        return minutes === 1 ? '1 minute' : `${minutes} minutes`;
    },

    // Highlight text matches
    highlightText: function(text, query) {
        if (!query) return text;
        const regex = new RegExp(`(${query})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    },

    // Load content dynamically
    loadContent: function(url, targetElement, showLoading = true) {
        const target = typeof targetElement === 'string' ? 
            document.querySelector(targetElement) : targetElement;
        
        if (!target) return Promise.reject('Target element not found');

        if (showLoading) {
            target.innerHTML = `
                <div class="text-center py-4">
                    <div class="spinner-border" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                    <p class="mt-2">Loading...</p>
                </div>
            `;
        }

        return fetch(url)
            .then(response => {
                if (!response.ok) throw new Error('Network response was not ok');
                return response.text();
            })
            .then(html => {
                target.innerHTML = html;
                // Re-initialize tooltips for new content
                this.setupTooltips();
                return html;
            })
            .catch(error => {
                target.innerHTML = `
                    <div class="alert alert-danger">
                        <i class="fas fa-exclamation-triangle me-2"></i>
                        Error loading content. Please try again.
                    </div>
                `;
                console.error('Error loading content:', error);
                throw error;
            });
    }
};

// Fact checking specific functions
const FactChecker = {
    // Submit claim for verification
    submitClaim: function(claimText) {
        return fetch('/api/fact-check', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ claim: claimText })
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) throw new Error(data.error);
            return data;
        });
    },

    // Get claim details
    getClaimDetails: function(claimId) {
        return fetch(`/api/fact-check/${claimId}`)
            .then(response => response.json())
            .then(data => {
                if (data.error) throw new Error(data.error);
                return data;
            });
    },

    // Submit report
    submitReport: function(reportData) {
        return fetch('/api/report', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(reportData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) throw new Error(data.error);
            return data;
        });
    },

    // Get trends data
    getTrends: function() {
        return fetch('/api/trends')
            .then(response => response.json())
            .then(data => {
                if (data.error) throw new Error(data.error);
                return data;
            });
    }
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    TruthLens.init();
    
    // Add smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Auto-resize textareas
    document.querySelectorAll('textarea').forEach(textarea => {
        textarea.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = (this.scrollHeight) + 'px';
        });
    });

    // Add loading state to form
    document.querySelectorAll('form').forEach(form => {
        form.addEventListener('submit', function() {
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = `
                    <span class="spinner-border spinner-border-sm me-2" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </span>
                    Processing...
                `;
            }
        });
    });
});

// Make TruthLens and FactChecker available globally
window.TruthLens = TruthLens;
window.FactChecker = FactChecker;
