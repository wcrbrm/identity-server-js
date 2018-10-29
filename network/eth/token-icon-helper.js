const fs = require('fs');

const fileToBase64 = (path) => {
  return new Promise(resolve => {
    const extension = path.split('.').pop();
    fs.readFile(path, (err, data) => {
      if (data) {
        const base64Str = data.toString('base64');
        resolve(`data:image/${extension};base64,${base64Str}`);
      }
      resolve();
    });
  });
};

const getIcon = async ({ contractAddress, name, symbol }) => {
  return new Promise((resolve, reject) => {
    try {
      fs.readFile(`${__dirname}/token_icons.json`, (err, data) => {
        const filePath = `${__dirname}/../../public`;
        if (err) {
          resolve('');
        }
        const icons = JSON.parse(data);
        const icon = icons[contractAddress];
        if (icon) {
          fileToBase64(`${filePath}/${icon}`).then(encImg => {
            resolve(encImg);
          });
        } else if (name || symbol) {
          // Try to guess icon name
          name = name.toLowerCase();
          symbol = symbol.toLowerCase();

          const probableNames = [
            `${name}.png`,
            `${name}_28.png`,
            `${name}_28.jpg`,
            `${name}28.png`,
            `${name.split(' ')[0]}_28.png`,
            `${symbol}.png`,
            `${symbol}_28.png`,
            `${symbol}28.png`,
          ];

          const promises = [];
          probableNames.forEach(pName => {
            promises.push(new Promise(_resolve => {
              fs.exists(`${filePath}/icons/${pName}`, exists => {
                if (exists) {
                  fileToBase64(`${filePath}/icons/${pName}`).then(encImg => {
                    _resolve(encImg);
                  });
                } else {
                  _resolve(false);
                }
              });
            }));
          });

          Promise.all(promises).then(values => {
            const encImg = values.find(v => v !== false);
            if (encImg) {
              resolve(encImg);
            } else {
              resolve();
            }
          });
        } else {
          resolve();
        }
      });
    } catch (e) {
      resolve();
    }
  });
};

module.exports = {
  fileToBase64,
  getIcon
};