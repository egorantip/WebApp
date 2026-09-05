import autocannon from 'autocannon';

const instance = autocannon({
    url: 'http://localhost:3000/',
    connections: 50, // одновременные соединения
    duration: 10     // в секундах
});

autocannon.track(instance, { renderProgressBar: true });

instance.on('done', () => {
    console.log('Тест завершён');
});