const filestorage = require('./filestorage');

async function test() {
  // Testando writeData
  const dataToWrite = [
    { id: 1, name: 'Alice' },
    { id: 2, name: 'Bob' },
  ];
  await filestorage.writeData(dataToWrite);
  console.log('Dados escritos no MongoDB');

  // Testando readData
  const data = await filestorage.readData();
  console.log('Dados lidos do MongoDB:');
  console.log(data);
}

test();