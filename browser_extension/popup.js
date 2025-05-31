document.addEventListener('DOMContentLoaded', function() {
    const textarea = document.getElementById('content');
    const checkButton = document.getElementById('check');
    const loadingDiv = document.querySelector('.loading');
    const resultsDiv = document.querySelector('.results');
    const scoreDiv = document.querySelector('.score');
    const detailsDiv = document.querySelector('.details');

    // Get API endpoint from storage or use default
    let apiEndpoint = 'https://edb45802-7c53-4151-8ab6-8345c51197d9-00-252w1l9x7npln.kirk.replit.dev/api/fact-check';

    // Verify we're in extension context
    if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.get('apiEndpoint', function(data) {
            if (data.apiEndpoint) {
                apiEndpoint = data.apiEndpoint;
            }
        });

        // Get selected text from storage when popup opens
        chrome.storage.local.get('selectedText', function(data) {
            if (data.selectedText) {
                textarea.value = data.selectedText;
                // Clear the stored text
                chrome.storage.local.remove('selectedText');
            }
        });

        // Try to get selected text from active tab if storage is empty
        if (!textarea.value) {
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                if (tabs[0]) {
                    try {
                        chrome.tabs.sendMessage(tabs[0].id, {
                            type: 'getSelectedText'
                        }, function(response) {
                            if (!chrome.runtime.lastError && response && response.text) {
                                textarea.value = response.text;
                            }
                        });
                    } catch (error) {
                        console.error('Error getting selected text:', error);
                    }
                }
            });
        }
    }

    // Update the score display section
    function displayResults(data) {
        console.log('Displaying results:', data); // Debug log

        if (!data || !data.results || !data.results[0]) {
            scoreDiv.textContent = 'Error: No results available';
            detailsDiv.innerHTML = '<p>Could not analyze the content.</p>';
            return;
        }

        const result = data.results[0];
        // Handle both number and object formats for credibility_score
        let score = 0;
        if (typeof result.credibility_score === 'number') {
            score = result.credibility_score / 10; // Convert from 0-10 to 0-1 scale
        } else if (result.credibility_score && result.credibility_score.score) {
            score = parseFloat(result.credibility_score.score) || 0;
        }
        
        scoreDiv.textContent = `Credibility Score: ${Math.round(score * 10)}/10`;
        scoreDiv.style.color = score >= 7 ? '#28a745' : score >= 4 ? '#ffc107' : '#dc3545';

        let detailsHtml = '<ul class="fact-list">';

        // Add reasoning if available
        if (result.reasoning) {
            detailsHtml += '<li class="fact-item"><div class="fact-rating">Analysis:</div>';
            if (typeof result.reasoning === 'string') {
                detailsHtml += `<div class="fact-text">${result.reasoning}</div>`;
            } else if (Array.isArray(result.reasoning)) {
                result.reasoning.forEach(reason => {
                    detailsHtml += `<div class="fact-text">${reason}</div>`;
                });
            }
            detailsHtml += '</li>';
        }

        // Add status information
        if (result.status) {
            detailsHtml += `<li class="fact-item"><div class="fact-rating">Status:</div><div class="fact-text">${result.status}</div></li>`;
        }

        // Add sources if available
        if (result.sources && result.sources.length > 0) {
            detailsHtml += '<li class="fact-item"><div class="fact-rating">Sources:</div>';
            result.sources.forEach(source => {
                detailsHtml += `<div class="fact-text">• ${source}</div>`;
            });
            detailsHtml += '</li>';
        }

        // Add matching facts if available
        if (result.fact_check && result.fact_check.matching_facts && result.fact_check.matching_facts.length > 0) {
            result.fact_check.matching_facts.forEach(fact => {
                detailsHtml += `
                    <li class="fact-item">
                        <div class="fact-rating">${fact.rating || 'Rating Not Available'}</div>
                        <div class="fact-text">${fact.text || 'No text available'}</div>
                        <div class="fact-source">Source: ${fact.publisher || 'Unknown'}</div>
                        ${fact.url ? `<a href="${fact.url}" target="_blank" class="fact-link">Read more →</a>` : ''}
                    </li>
                `;
            });
        }
        detailsHtml += '</ul>';

        detailsDiv.innerHTML = detailsHtml;
        resultsDiv.style.display = 'block';
    }

    // Update the main event listener
    checkButton.addEventListener('click', async function() {
        const text = textarea.value.trim();
        if (!text) {
            alert('Please enter or select text to fact-check');
            return;
        }

        // Show loading state
        loadingDiv.style.display = 'block';
        resultsDiv.style.display = 'none';
        checkButton.disabled = true;

        try {
            console.log('Sending request to:', apiEndpoint); // Debug log
            // Send to backend API
            const response = await fetch(apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Extension-Context': 'true',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify({ content: text })
            });

            if (!response.ok) {
                throw new Error(`Server returned ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('Received response:', data); // Debug log

            if (data.error) {
                throw new Error(data.error);
            }

            // Display results
            displayResults(data);

            // Try to highlight the text in the webpage if in extension context
            if (typeof chrome !== 'undefined' && chrome.tabs) {
                chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                    if (tabs[0]) {
                        try {
                            chrome.tabs.sendMessage(tabs[0].id, {
                                type: 'highlightText',
                                text: text
                            }, function(response) {
                                if (chrome.runtime.lastError) {
                                    console.log('Could not highlight text:', chrome.runtime.lastError);
                                }
                            });
                        } catch (error) {
                            console.error('Error highlighting text:', error);
                        }
                    }
                });
            }

        } catch (error) {
            detailsDiv.innerHTML = `
                <div class="error">
                    <p>Error: ${error.message}</p>
                    <p>Please try again later or check your internet connection.</p>
                </div>
            `;
            resultsDiv.style.display = 'block';
        }

        // Hide loading state
        loadingDiv.style.display = 'none';
        checkButton.disabled = false;
    });
});