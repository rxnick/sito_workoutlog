import streamlit as st

# Titolo della pagina
st.title("Il mio primo sito con Streamlit! 🚀")

# Un po' di testo
st.write("Ciao! Questo sito è stato pubblicato direttamente da GitHub.")

# Un bottone interattivo
if st.button("Cliccami"):
    st.balloons()
    st.success("Funziona alla grande!")