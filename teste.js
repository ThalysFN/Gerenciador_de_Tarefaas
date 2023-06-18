require('dotenv').config(); // Carrega as variáveis de ambiente do arquivo .env

const privateKeyBase64 = Buffer.from(process.env.PRIVATE_KEY, 'UTF-8').toString('base64');

console.log(privateKeyBase64); // Exibe a chave privada codificada em base64
