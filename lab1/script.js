const logger = console.log;

// 1. Конвертация температуры
function convertTemperature(value, direction) {
    if (direction === 'toC') {
        const result = (value - 32) * 5 / 9;
        return `${result.toFixed(0)} C`;
    }

    if (direction === 'toF') {
        const result = value * 9 / 5 + 32;
        return `${result.toFixed(0)} F`;
    }

    return 'Неверное направление';
}

logger('// 1. Конвертация температуры');
logger('convertTemperature(32, "toC") =', convertTemperature(32, 'toC'));
logger('convertTemperature(10, "toF") =', convertTemperature(10, 'toF'));


// 2. Треугольник
function checkTriangle(a, b, c) {
    const isInvalid =
        a <= 0 ||
        b <= 0 ||
        c <= 0 ||
        a + b <= c ||
        a + c <= b ||
        b + c <= a;

    if (isInvalid) {
        logger('Треугольника не существует');
        return;
    }

    logger('Треугольник существует');

    const perimeter = a + b + c;
    const semiPerimeter = perimeter / 2;
    const area = Math.sqrt(
        semiPerimeter *
        (semiPerimeter - a) *
        (semiPerimeter - b) *
        (semiPerimeter - c)
    );

    logger('Периметр =', `${perimeter} см`);
    logger('Площадь =', `${area} см^2`);
    logger('Соотношение =', perimeter / area);
}

logger('// 2. Треугольник');
checkTriangle(3, 4, 5);


// 3. Fizz-buzz
function fizzBuzz(limit) {
    for (let i = 0; i <= limit; i += 1) {
        let output = '';

        if (i % 5 === 0) {
            output = 'fizz buzz';
        } else if (i % 2 === 0) {
            output = 'buzz';
        } else {
            output = 'fizz';
        }

        logger(i, output);
    }
}

logger('// 3. Fizz-buzz');
fizzBuzz(6);


// 4. Ёлка
function printTree(height) {
    if (height < 3) {
        logger('Слишком мало');
        return;
    }

    let tree = '';
    let symbol = '*';

    for (let i = 1; i < height; i += 1) {
        tree += symbol.repeat(i) + '\n';
        symbol = symbol === '*' ? '#' : '*';
    }

    tree += '||';
    logger(tree);
}

logger('// 4. Ёлка');
printTree(10);


// 5. Деление нацело
function checkDivision(n, x, y) {
    const isDivisible = n % x === 0 && n % y === 0;
    logger(`n = ${n}, x = ${x}, y = ${y} -> ${isDivisible}`);
}

logger('// 5. Деление нацело');
checkDivision(100, 3, 4);


// 6. Сэндвичи с сыром
function countSandwiches(ingredients) {
    const breadMax = Math.floor(ingredients.bread / 2);
    const cheeseMax = ingredients.cheese;
    return Math.min(breadMax, cheeseMax);
}

logger('countSandwiches({bread: 5, cheese: 6}) =', countSandwiches({ bread: 5, cheese: 6 }));


// 7. Абсолютное значение
function absoluteValue(x) {
    return x >= 0 ? x : -x;
}

logger('// 7. Абсолютное значение');
logger('absoluteValue(100):', absoluteValue(100));
logger('absoluteValue(-45):', absoluteValue(-45));
logger('absoluteValue(0):', absoluteValue(0));


// 8. Случайные числа
function randomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

logger('// 8. Случайные числа');
logger('randomNumber(20, 44):', randomNumber(20, 44));

// 9. Значение из массива
function sampleArray(array, count) {
    const result = [];
    for (let i = 0; i < count; i += 1) {
        const index = Math.floor(Math.random() * array.length);
        result.push(array[index]);
    }
    return result;
}

logger('// 9. Значение из массива');
logger('sampleArray([2, 4, 8, 16, 32], 2):', sampleArray([2, 4, 8, 16, 32], 2));


// 10. Фильтрация массива
function isFirstS(name) {
    return name.startsWith('S');
}

function myFilterArray(array, predicate) {
    const result = [];
    for (const item of array) {
        if (predicate(item)) {
            result.push(item);
        }
    }
    return result;
}

logger('// 10. Фильтрация массива');
logger(myFilterArray(['Short', 'VeryLong'], isFirstS));


// 11. Равенство чисел
function toBeCloseTo(num1, num2) {
    const epsilon = Number.EPSILON;
    const absNum1 = Math.abs(num1);
    const absNum2 = Math.abs(num2);
    const diff = Math.abs(num1 - num2);
    if (num1 === num2) return true;
    if (num1 === 0 || num2 === 0) return diff < epsilon;
    const absMax = Math.max(absNum1, absNum2);
    return diff / absMax < epsilon;
}
logger('// 11. Равенство чисел');
logger('toBeCloseTo(0.1 + 0.2, 0.3) =', toBeCloseTo(0.1 + 0.2, 0.3));
