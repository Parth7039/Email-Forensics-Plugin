// url_phishing_detector.js - Detects phishing URLs in emails

console.log("🔗 URL Phishing Detector Module Loaded");

// ============= SUSPICIOUS TLDs =============
const SUSPICIOUS_TLDS = [
  '.xyz', '.top', '.tk', '.ml', '.ga', '.cf', '.gq',
  '.work', '.click', '.link', '.racing', '.kim', '.party',
  '.trade', '.webcam', '.win', '.download', '.bid', '.loan',
  '.science', '.cricket', '.stream', '.date', '.review'
];

// ============= TRUSTED DOMAINS =============
const TRUSTED_DOMAINS = [
  // Major Tech Companies
  'google.com', 'gmail.com', 'youtube.com', 'google.co.in',
  'facebook.com', 'instagram.com', 'whatsapp.com', 'meta.com',
  'amazon.com', 'amazon.in', 'amazon.co.uk',
  'microsoft.com', 'outlook.com', 'office.com', 'live.com',
  'apple.com', 'icloud.com',
  'twitter.com', 'x.com',
  'linkedin.com',
  'github.com', 'gitlab.com',
  'stackoverflow.com', 'stackexchange.com',
  'reddit.com',
  'wikipedia.org', 'wikimedia.org',
  
  // E-commerce & Payment
  'paypal.com',
  'ebay.com', 'ebay.in',
  'flipkart.com',
  'myntra.com',
  'paytm.com',
  'phonepe.com',
  'gpay.com',
  'razorpay.com',
  'stripe.com',
  
  // Banking & Financial (India)
  'sbi.co.in',
  'hdfcbank.com',
  'icicibank.com',
  'axisbank.com',
  'kotak.com',
  'yesbank.in',
  'pnbindia.in',
  'bankofbaroda.in',
  'rbi.org.in',
  
  // Government (India)
  'india.gov.in',
  'gov.in',
  'uidai.gov.in',
  'epfindia.gov.in',
  'incometax.gov.in',
  'gst.gov.in',
  'mygov.in',
  'digilocker.gov.in',
  
  // IT Companies (India)
  'tcs.com',
  'infosys.com',
  'wipro.com',
  'hcl.com',
  'techmahindra.com',
  'ltimindtree.com',
  
  // Streaming & Entertainment
  'netflix.com',
  'spotify.com',
  'hotstar.com',
  'primevideo.com',
  'zee5.com',
  'sonyliv.com',
  
  // Education & Productivity
  'coursera.org',
  'udemy.com',
  'zoom.us',
  'teams.microsoft.com',
  'meet.google.com',
  'slack.com',
  'notion.so',
  'trello.com',
  
  // Cloud & Development
  'aws.amazon.com',
  'azure.microsoft.com',
  'cloud.google.com',
  'digitalocean.com',
  'heroku.com',
  'vercel.com',
  'netlify.com',
  
  // News & Media
  'bbc.com', 'bbc.co.uk',
  'cnn.com',
  'reuters.com',
  'theguardian.com',
  'timesofindia.com',
  'hindustantimes.com',
  'indianexpress.com',
  'ndtv.com',
  
  // Other Popular Services
  'adobe.com',
  'dropbox.com',
  'yahoo.com',
  'wordpress.com',
  'medium.com',
  'quora.com'
];

// ============= URL SHORTENERS =============
const URL_SHORTENERS = [
  'bit.ly', 'tinyurl.com', 'goo.gl', 't.co',
  'ow.ly', 'is.gd', 'buff.ly', 'adf.ly',
  'bl.ink', 'lnkd.in', 'short.link', 'cutt.ly'
];

// ============= SUSPICIOUS KEYWORDS =============
const SUSPICIOUS_KEYWORDS = [
  'verify', 'account', 'suspend', 'urgent', 'security',
  'update', 'confirm', 'banking', 'password', 'login',
  'signin', 'secure', 'locked', 'unusual', 'activity',
  'paypal', 'amazon', 'microsoft', 'apple', 'google',
  'facebook', 'netflix', 'bank', 'payment', 'billing'
];

// ============= LOOK-ALIKE CHARACTERS =============
const LOOKALIKE_CHARS = {
  '0': 'o',
  '1': 'l',
  '3': 'e',
  '5': 's',
  '8': 'b',
  'rn': 'm',
  'vv': 'w'
};

/**
 * Main function to detect phishing URLs in email
 * @param {string} emailHtml - The HTML content of the email
 * @param {string} emailText - The plain text content of the email
 * @returns {Object} - Detection results
 */
function detectPhishingUrls(emailHtml, emailText) {
  const urls = extractUrls(emailHtml, emailText);
  const results = {
    totalUrls: urls.length,
    suspiciousUrls: [],
    riskLevel: 'low', // low, medium, high, critical
    warnings: [],
    isFishy: false
  };

  if (urls.length === 0) {
    return results;
  }

  // Analyze each URL
  urls.forEach(urlData => {
    const analysis = analyzeUrl(urlData.url, urlData.anchorText);
    if (analysis.suspicious) {
      results.suspiciousUrls.push({
        url: urlData.url,
        anchorText: urlData.anchorText,
        reasons: analysis.reasons,
        riskScore: analysis.riskScore
      });
    }
  });

  // Calculate overall risk level
  if (results.suspiciousUrls.length > 0) {
    results.isFishy = true;
    const maxRiskScore = Math.max(...results.suspiciousUrls.map(u => u.riskScore));
    
    if (maxRiskScore >= 80) {
      results.riskLevel = 'critical';
    } else if (maxRiskScore >= 60) {
      results.riskLevel = 'high';
    } else if (maxRiskScore >= 40) {
      results.riskLevel = 'medium';
    } else {
      results.riskLevel = 'low';
    }

    // Generate warnings
    results.warnings = generateWarnings(results.suspiciousUrls);
  }

  return results;
}

/**
 * Extract all URLs from email HTML and text
 */
function extractUrls(emailHtml, emailText) {
  const urls = [];
  const urlRegex = /(https?:\/\/[^\s<>"']+)/gi;
  
  // Extract from HTML links with anchor text
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = emailHtml;
  const links = tempDiv.querySelectorAll('a[href]');
  
  links.forEach(link => {
    const href = link.getAttribute('href');
    const anchorText = link.textContent.trim();
    if (href && href.startsWith('http')) {
      urls.push({
        url: href,
        anchorText: anchorText || href
      });
    }
  });

  // Also extract plain URLs from text
  const plainUrls = emailText.match(urlRegex) || [];
  plainUrls.forEach(url => {
    if (!urls.some(u => u.url === url)) {
      urls.push({
        url: url,
        anchorText: url
      });
    }
  });

  return urls;
}

/**
 * Analyze a single URL for phishing indicators
 */
function analyzeUrl(url, anchorText) {
  const analysis = {
    suspicious: false,
    reasons: [],
    riskScore: 0
  };

  try {
    const urlObj = new URL(url);
    
    // ============= CHECK IF DOMAIN IS TRUSTED =============
    // Skip analysis for trusted domains
    const cleanHostname = urlObj.hostname.toLowerCase().replace(/^www\./, '');
    
    for (const trustedDomain of TRUSTED_DOMAINS) {
      if (cleanHostname === trustedDomain || cleanHostname.endsWith('.' + trustedDomain)) {
        console.log(`✅ Trusted domain detected: ${cleanHostname}`);
        return analysis; // Return as safe, skip all checks
      }
    }
    // =====================================================
    
    // 1. Check for IP address instead of domain
    if (isIpAddress(urlObj.hostname)) {
      analysis.reasons.push("⚠️ Uses IP address instead of domain name");
      analysis.riskScore += 30;
      analysis.suspicious = true;
    }

    // 2. Check for suspicious TLDs
    const tldCheck = checkSuspiciousTld(urlObj.hostname);
    if (tldCheck.suspicious) {
      analysis.reasons.push(`⚠️ Suspicious domain extension: ${tldCheck.tld}`);
      analysis.riskScore += 20;
      analysis.suspicious = true;
    }

    // 3. Check for too many subdomains
    const subdomainCount = countSubdomains(urlObj.hostname);
    if (subdomainCount >= 4) {
      analysis.reasons.push(`⚠️ Too many subdomains (${subdomainCount})`);
      analysis.riskScore += 25;
      analysis.suspicious = true;
    }

    // 4. Check for look-alike domains
    if (isLookAlikeDomain(urlObj.hostname)) {
      analysis.reasons.push("🚨 Domain looks like a known brand (typosquatting)");
      analysis.riskScore += 40;
      analysis.suspicious = true;
    }

    // 5. Check for URL shorteners
    if (isUrlShortener(urlObj.hostname)) {
      analysis.reasons.push("⚠️ URL shortener detected - actual destination hidden");
      analysis.riskScore += 15;
      analysis.suspicious = true;
    }

    // 6. Check for HTTP instead of HTTPS
    if (urlObj.protocol === 'http:') {
      analysis.reasons.push("⚠️ Uses insecure HTTP (not HTTPS)");
      analysis.riskScore += 10;
      analysis.suspicious = true;
    }

    // 7. Check for encoded characters
    if (hasEncodedCharacters(url)) {
      analysis.reasons.push("⚠️ Contains encoded characters in URL");
      analysis.riskScore += 20;
      analysis.suspicious = true;
    }

    // 8. Check for special suspicious characters
    const specialChars = checkSuspiciousCharacters(url);
    if (specialChars.length > 0) {
      analysis.reasons.push(`⚠️ Suspicious characters: ${specialChars.join(', ')}`);
      analysis.riskScore += 15;
      analysis.suspicious = true;
    }

    // 9. Check for suspicious keywords in URL
    const suspiciousKeywords = findSuspiciousKeywords(url.toLowerCase());
    if (suspiciousKeywords.length > 0) {
      analysis.reasons.push(`⚠️ Suspicious keywords: ${suspiciousKeywords.join(', ')}`);
      analysis.riskScore += 10 * suspiciousKeywords.length;
      analysis.suspicious = true;
    }

    // 10. Check for anchor text mismatch
    if (anchorText && anchorText !== url) {
      const mismatch = checkAnchorTextMismatch(url, anchorText);
      if (mismatch) {
        analysis.reasons.push(`🚨 Link text mismatch: Shows "${anchorText}" but goes to different site`);
        analysis.riskScore += 35;
        analysis.suspicious = true;
      }
    }

    // Cap risk score at 100
    analysis.riskScore = Math.min(analysis.riskScore, 100);

  } catch (error) {
    console.error("Error analyzing URL:", error);
    analysis.reasons.push("⚠️ Malformed or invalid URL");
    analysis.riskScore = 50;
    analysis.suspicious = true;
  }

  return analysis;
}

/**
 * Check if hostname is an IP address
 */
function isIpAddress(hostname) {
  const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/;
  const ipv6Pattern = /^[0-9a-fA-F:]+$/;
  return ipv4Pattern.test(hostname) || ipv6Pattern.test(hostname);
}

/**
 * Check for suspicious TLD
 */
function checkSuspiciousTld(hostname) {
  // Whitelist legitimate country-specific and org TLDs
  const legitimateTLDs = [
    '.gov.in', '.org.in', '.co.in', '.ac.in', '.edu.in',
    '.gov.uk', '.gov.au', '.gov',
    '.org', '.edu', '.ac.uk',
    '.com', '.net', '.in', '.uk', '.us', '.ca', '.au'
  ];
  
  // Check if domain ends with legitimate TLD
  for (const legitTld of legitimateTLDs) {
    if (hostname.endsWith(legitTld)) {
      return { suspicious: false };
    }
  }
  
  // Now check for suspicious TLDs
  for (const tld of SUSPICIOUS_TLDS) {
    if (hostname.endsWith(tld)) {
      return { suspicious: true, tld: tld };
    }
  }
  
  return { suspicious: false };
}

/**
 * Count subdomains in hostname
 */
function countSubdomains(hostname) {
  const parts = hostname.split('.');
  return parts.length - 2; // Subtract domain and TLD
}

/**
 * Check if domain is trying to impersonate a trusted brand
 */
function isLookAlikeDomain(hostname) {
  const cleanHost = hostname.toLowerCase().replace(/^www\./, '');
  
  // First check if it's actually a trusted domain
  for (const trusted of TRUSTED_DOMAINS) {
    if (cleanHost === trusted || cleanHost.endsWith('.' + trusted)) {
      return false; // It's the real domain, not a look-alike
    }
  }
  
  // Now check for impersonation attempts
  for (const trusted of TRUSTED_DOMAINS) {
    const brand = trusted.split('.')[0]; // e.g., 'google' from 'google.com'
    
    // Skip very short brand names to avoid false positives
    if (brand.length < 4) continue;
    
    // Check for character substitution (only if brand name is in hostname)
    if (cleanHost.includes(brand)) {
      if (hasLookAlikeCharacters(cleanHost, trusted)) {
        return true;
      }
    }
    
    // Check for brand name in subdomain (but not as main domain)
    const domainParts = cleanHost.split('.');
    if (domainParts.length > 2) {
      // Only flag if brand is in subdomain AND main domain is suspicious
      for (let i = 0; i < domainParts.length - 2; i++) {
        if (domainParts[i] === brand || domainParts[i].includes(brand)) {
          // Check if the actual domain (last two parts) is NOT the trusted domain
          const actualDomain = domainParts.slice(-2).join('.');
          if (actualDomain !== trusted) {
            return true; // e.g., paypal.fake-site.com
          }
        }
      }
    }
  }
  
  return false;
}

/**
 * Check for look-alike character substitutions
 */
function hasLookAlikeCharacters(hostname, trustedDomain) {
  const brand = trustedDomain.split('.')[0];
  
  // Check for common substitutions
  const checks = [
    hostname.includes(brand.replace('o', '0')),
    hostname.includes(brand.replace('l', '1')),
    hostname.includes(brand.replace('a', '4')),
    hostname.includes(brand.replace('e', '3')),
    hostname.includes(brand.replace('s', '5')),
  ];
  
  return checks.some(check => check);
}

/**
 * Check if domain is a URL shortener
 */
function isUrlShortener(hostname) {
  const cleanHost = hostname.toLowerCase().replace(/^www\./, '');
  return URL_SHORTENERS.some(shortener => cleanHost === shortener);
}

/**
 * Check for encoded characters in URL
 */
function hasEncodedCharacters(url) {
  return /%[0-9a-fA-F]{2}/.test(url);
}

/**
 * Check for suspicious special characters
 */
function checkSuspiciousCharacters(url) {
  const suspicious = [];
  
  if (url.includes('@')) suspicious.push('@');
  if ((url.match(/\//g) || []).length > 3) suspicious.push('multiple //');
  if (url.includes('-secure')) suspicious.push('-secure');
  if (url.includes('-verify')) suspicious.push('-verify');
  if (url.includes('-login')) suspicious.push('-login');
  if (url.includes('-account')) suspicious.push('-account');
  
  return suspicious;
}

/**
 * Find suspicious keywords in URL
 */
function findSuspiciousKeywords(url) {
  const found = [];
  
  // Don't flag common legitimate keywords from trusted domains
  const urlLower = url.toLowerCase();
  
  for (const keyword of SUSPICIOUS_KEYWORDS) {
    // Only flag if keyword appears in a suspicious context
    // Not if it's part of a trusted domain
    let isInTrustedContext = false;
    
    for (const trusted of TRUSTED_DOMAINS) {
      if (urlLower.includes(trusted)) {
        isInTrustedContext = true;
        break;
      }
    }
    
    if (!isInTrustedContext && urlLower.includes(keyword)) {
      found.push(keyword);
    }
  }
  return found.slice(0, 3); // Return max 3 keywords
}

/**
 * Check if anchor text mismatches the actual URL
 */
function checkAnchorTextMismatch(url, anchorText) {
  try {
    // If anchor text looks like a URL, compare domains
    if (anchorText.includes('http') || anchorText.includes('www.') || anchorText.includes('.com')) {
      const urlObj = new URL(url);
      const displayedDomain = extractDomain(anchorText);
      const actualDomain = urlObj.hostname.replace(/^www\./, '');
      
      if (displayedDomain && displayedDomain !== actualDomain) {
        return true;
      }
    }
  } catch (error) {
    // Ignore parsing errors
  }
  return false;
}

/**
 * Extract domain from text
 */
function extractDomain(text) {
  const domainMatch = text.match(/(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  return domainMatch ? domainMatch[1].replace(/^www\./, '') : null;
}

/**
 * Generate warning messages based on suspicious URLs
 */
function generateWarnings(suspiciousUrls) {
  const warnings = [];
  
  if (suspiciousUrls.length > 0) {
    const criticalUrls = suspiciousUrls.filter(u => u.riskScore >= 80);
    const highRiskUrls = suspiciousUrls.filter(u => u.riskScore >= 60 && u.riskScore < 80);
    
    if (criticalUrls.length > 0) {
      warnings.push(`🚨 CRITICAL: ${criticalUrls.length} extremely suspicious URL(s) detected!`);
    }
    
    if (highRiskUrls.length > 0) {
      warnings.push(`⚠️ HIGH RISK: ${highRiskUrls.length} suspicious URL(s) found`);
    }
    
    warnings.push(`💡 Hover over links before clicking to verify the actual destination`);
  }
  
  return warnings;
}

// Export functions for use in content_script.js
window.urlPhishingDetector = {
  detectPhishingUrls: detectPhishingUrls,
  analyzeUrl: analyzeUrl
};

console.log("✅ URL Phishing Detector Ready!");