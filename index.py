import streamlit as st
from langchain_helper import create_vector_db, get_qa_chain

st.title("AutoBrain🧠🧠")

btn = st.button("Create Knowledge")
if btn:
    with st.spinner("Creating vector database... Please wait ⏳"):
        create_vector_db()
    st.success("Knowledge base created successfully ✅")

question = st.text_input("What is your question?")
if question:
    chain = get_qa_chain()
    response = chain(question)

    st.header("Answer:")
    st.write(response["result"])
