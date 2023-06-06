const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');
// Substitua pelos valores corretos
const uri = "mongodb+srv://bancogerenciador:bancogerenciador@nuvembanco.ka2nfcd.mongodb.net/?retryWrites=true&w=majority";

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

// Nome da coleção onde os dados serão armazenados
const COLLECTION_NAME = 'GerenciadorTarefas';

async function withMongoDb(callback) {
  const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

  try {
    await client.connect();
    const db = client.db('NuvemBanco'); // Substitua pelo nome do seu banco de dados
    const collection = db.collection(COLLECTION_NAME);

    return await callback(collection);
  } catch (err) {
    console.error('Erro ao trabalhar com o MongoDB:', err);
    throw err;
  } finally {
    await client.close();
  }
}
async function readData() {
  return withMongoDb(async (collection) => {
    const data = await collection.find({}).toArray();
    return data;
  });
}
async function writeData(data) {
  return withMongoDb(async (collection) => {
    // Remove todos os documentos existentes na coleção antes de inserir os novos dados
    await collection.deleteMany({});
    await collection.insertMany(data);
  });
}
async function findUserByEmail(email) {
  return await withMongoDb(async collection => {
    return await collection.findOne({ email: email });
  });
}
async function findUserById(id) {
  return await withMongoDb(async collection => {
    return await collection.findOne({ id: id });
  });
}


module.exports = { readData, writeData, findUserByEmail,findUserById };