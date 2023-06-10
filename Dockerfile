# Use uma imagem base com o Node.js instalado
FROM node:16

# Defina o diretório de trabalho dentro do contêiner
WORKDIR /app

# Copie os arquivos do projeto para o diretório de trabalho
COPY package.json package-lock.json /app/
RUN npm ci --production

# Copie o código-fonte para o diretório de trabalho
COPY . /app

# Exponha a porta em que a aplicação Node.js está ouvindo
EXPOSE 3000

# Comando para iniciar a aplicação
CMD ["npm", "start"]