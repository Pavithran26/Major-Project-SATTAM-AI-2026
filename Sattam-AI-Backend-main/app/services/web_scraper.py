import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
import re
from typing import List, Dict, Any
from langchain.schema import Document
from app.config import settings

class TamilNaduLawScraper:
    def __init__(self):
        self.headers = {
            "User-Agent": settings.USER_AGENT
        }
        self.tamil_law_websites = [
            "https://www.tn.gov.in/law",
            "https://www.tn.gov.in/judiciary",
            "https://www.tnlegislature.gov.in/",
            "https://www.hcmadras.tn.nic.in/"
        ]
    
    def scrape_website(self, url: str, max_pages: int = 50) -> List[Document]:
        """Scrape law-related content from a website"""
        documents = []
        visited = set()
        to_visit = [url]
        
        while to_visit and len(visited) < max_pages:
            current_url = to_visit.pop(0)
            
            if current_url in visited:
                continue
            
            try:
                response = requests.get(current_url, headers=self.headers, timeout=10)
                if response.status_code != 200:
                    continue
                
                soup = BeautifulSoup(response.content, 'html.parser')
                
                # Extract text content
                text = self.extract_relevant_text(soup)
                
                if text and len(text) > 100:  # Minimum content length
                    doc = Document(
                        page_content=text,
                        metadata={
                            "source": current_url,
                            "type": "website",
                            "title": soup.title.string if soup.title else "No title"
                        }
                    )
                    documents.append(doc)
                
                # Find and add new links
                if len(visited) < max_pages:
                    new_links = self.extract_links(soup, current_url)
                    to_visit.extend(new_links)
                
                visited.add(current_url)
                
            except Exception as e:
                print(f"Error scraping {current_url}: {e}")
                continue
        
        return documents
    
    def extract_relevant_text(self, soup: BeautifulSoup) -> str:
        """Extract relevant legal text from webpage"""
        # Remove unwanted elements
        for element in soup(["script", "style", "nav", "footer", "header"]):
            element.decompose()
        
        # Look for legal content in specific elements
        legal_keywords = ['act', 'law', 'section', 'clause', 'rule', 'regulation', 
                         'தொகுப்பு', 'சட்டம்', 'பிரிவு', 'விதி']
        
        content = ""
        # Check main content areas
        for tag in ['article', 'main', 'div.content', 'section']:
            elements = soup.select(tag)
            for elem in elements:
                text = elem.get_text(strip=True)
                if any(keyword.lower() in text.lower() for keyword in legal_keywords):
                    content += text + "\n"
        
        # If no specific legal content found, get all text
        if not content:
            content = soup.get_text()
        
        # Clean text
        content = re.sub(r'\s+', ' ', content)
        return content.strip()
    
    def extract_links(self, soup: BeautifulSoup, base_url: str) -> List[str]:
        """Extract relevant links from page"""
        links = []
        for a_tag in soup.find_all('a', href=True):
            href = a_tag['href']
            absolute_url = urljoin(base_url, href)
            
            # Filter for relevant pages
            if self.is_relevant_url(absolute_url):
                links.append(absolute_url)
        
        return list(set(links))  # Remove duplicates
    
    def is_relevant_url(self, url: str) -> bool:
        """Check if URL is relevant to Tamil Nadu law"""
        law_keywords = ['law', 'legal', 'act', 'judiciary', 'court', 
                       'சட்ட', 'நீதிமன்ற', 'சட்டம்']
        url_lower = url.lower()
        
        return any(keyword in url_lower for keyword in law_keywords)