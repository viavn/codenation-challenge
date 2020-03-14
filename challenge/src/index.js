const fs = require('fs');
const crypto = require('crypto');
var request = require('request');

// const token = 'SEU TOKEN AQUI';
// const url = `https://api.codenation.dev/v1/challenge/dev-ps/generate-data?token=${token}`;
// const sendUrl = `https://api.codenation.dev/v1/challenge/dev-ps/submit-solution?token=${token}`;
const localUrl = 'http://localhost:8080';

request.get(localUrl, (error, response) => {
  if (error) {
    throw Error(`Erro ao realizar requisição:\n\n ${error}`);
    return
  }

  const challenge = JSON.parse(response.body);
  const phrase = decryptPhrase(challenge.cifrado);

  challenge.resumo_criptografico = SHA1Encrypt(phrase);
  challenge.decifrado = phrase;

  saveFile(challenge, (fileName) => {
    uploadFiletoServer(fileName);
  })
})

function saveFile(challengeObj, callback) {
  const fileName = 'answer.json';

  fs.writeFile(fileName, JSON.stringify(challengeObj, null, 2), function (err) {
    if (err) {
      console.log('Falha ao escrever arquivo!');
      return
    }

    callback(fileName);
  })
}

function uploadFiletoServer(fileName) {
  const params = {
    answer: {
      value: fs.createReadStream(`./${fileName}`),
      options: {
        filename: fileName,
        contentType: 'application/json'
      }
    }
  };

  request.post({
    url: `${localUrl}/upload`,
    method: 'POST',
    formData: params
  }, (error, response, body) => {
    if (error) console.log(error);

    console.log(body);
  });
}

function decryptPhrase(phrase) {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.toLowerCase().split('');
  let result = '';

  phrase.split('').forEach((word) => {
    let index = letters.findIndex(w => w === word);

    // Se não encontrar a letra,
    // possívelmente será algum caracter especial
    if (index < 0) {
      result += word;
    } else {
      index -= 12;

      // Letras no começo do alfabeto irão ficar
      // com valor negativo
      if (index < 0) {
        // Transformando o número em positivo
        // Outra forma: 26 + index
        index = 26 - (index * -1);
      }

      result += letters[index];
    }
  });

  return result;
}

function SHA1Encrypt(phrase) {
  const hash = crypto.createHash('sha1');
  hash.update(phrase);

  return hash.digest('hex');
}