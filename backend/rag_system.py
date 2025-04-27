from langchain_community.embeddings import OpenAIEmbeddings
from langchain_community.vectorstores import FAISS
from langchain.chains import RetrievalQA
from langchain_openai import ChatOpenAI
from langchain.prompts import PromptTemplate
from langchain.memory import ConversationBufferMemory
from typing import List, Dict, Any
import os
from dotenv import load_dotenv

load_dotenv()

class AshaRAGSystem:
    def __init__(self):
        self.embeddings = OpenAIEmbeddings()
        self.llm = ChatOpenAI(temperature=0.7, model="gpt-4")
        self.memory = ConversationBufferMemory(
            memory_key="chat_history",
            return_messages=True
        )
        
        # Initialize vector store (will be populated with data)
        self.vector_store = None
        
        # Define the prompt template
        self.prompt_template = """
        You are Asha, an AI assistant for the JobsForHer Foundation. Your role is to help women with their career development, job search, and professional growth.
        
        Core Principles:
        1. Always provide inclusive, bias-free responses that empower women in their careers
        2. Focus on accurate, factual information from the provided context
        3. Maintain professionalism while being supportive and encouraging
        4. If unsure, be transparent and guide users to appropriate resources
        
        Context: {context}
        Chat History: {chat_history}
        Question: {question}
        
        Provide a clear, helpful response that directly addresses the question while incorporating relevant information from the context. If the query contains any gender bias, address it professionally while redirecting to inclusive perspectives.
        """
        
        self.prompt = PromptTemplate(
            template=self.prompt_template,
            input_variables=["context", "chat_history", "question"]
        )
        
        # Initialize the QA chain
        self.qa_chain = None

    def initialize_vector_store(self, documents: List[Dict[str, Any]]):
        """
        Initialize the vector store with documents
        """
        texts = [doc["text"] for doc in documents]
        metadatas = [doc["metadata"] for doc in documents]
        
        self.vector_store = FAISS.from_texts(
            texts,
            self.embeddings,
            metadatas=metadatas
        )
        
        self.qa_chain = RetrievalQA.from_chain_type(
            llm=self.llm,
            chain_type="stuff",
            retriever=self.vector_store.as_retriever(),
            memory=self.memory,
            chain_type_kwargs={"prompt": self.prompt}
        )

    def detect_bias(self, text: str) -> Dict[str, Any]:
        """
        Detect potential gender bias in text
        """
        bias_prompt = f"""
        Analyze the following text for potential gender bias. Return a JSON with:
        - has_bias: boolean
        - bias_type: string or null
        - suggestion: string or null
        
        Text: {text}
        """
        try:
            response = self.llm.predict(bias_prompt)
            return eval(response)
        except:
            return {"has_bias": False, "bias_type": None, "suggestion": None}

    def process_query(self, query: str) -> Dict[str, Any]:
        """
        Process a user query and return a response with bias analysis
        """
        if not self.qa_chain:
            return {
                "response": "I apologize, but I'm still initializing. Please try again in a moment.",
                "bias_detected": False
            }
        
        try:
            # Check for bias
            bias_check = self.detect_bias(query)
            
            # Get response from RAG system
            response = self.qa_chain.run(query)
            
            return {
                "response": response,
                "bias_detected": bias_check["has_bias"],
                "bias_type": bias_check["bias_type"],
                "suggestion": bias_check["suggestion"]
            }
        except Exception as e:
            return {
                "response": f"I encountered an error while processing your query: {str(e)}",
                "bias_detected": False
            }

    def add_documents(self, documents: List[Dict[str, Any]]):
        """
        Add new documents to the vector store
        """
        if not self.vector_store:
            self.initialize_vector_store(documents)
        else:
            texts = [doc["text"] for doc in documents]
            metadatas = [doc["metadata"] for doc in documents]
            self.vector_store.add_texts(texts, metadatas)

    def clear_memory(self):
        """
        Clear the conversation memory
        """
        self.memory.clear()

# Example usage:
# rag_system = AshaRAGSystem()
# documents = [
#     {"text": "Job listing for Software Engineer at Company X", "metadata": {"type": "job", "source": "company_x"}},
#     {"text": "Upcoming webinar on Career Development", "metadata": {"type": "event", "source": "webinar"}}
# ]
# rag_system.initialize_vector_store(documents)
# response = rag_system.process_query("Tell me about job opportunities") 