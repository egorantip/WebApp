/**
 * @fileoverview ESLint конфигурация для проекта воксельного редактора
 * @see https://eslint.org/docs/latest/use/configure/configuration-files
 */

export default [
    {
        files: ["**/*.js"],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: "module",
            globals: {
                // Глобальные переменные браузера
                window: "readonly",
                document: "readonly",
                console: "readonly",
                fetch: "readonly",
                ResizeObserver: "readonly",
                Float32Array: "readonly",
                Uint32Array: "readonly",
                THREE: "readonly"
            }
        },
        rules: {
            // ===== Possible Problems =====
            /**
             * Запрещает использование шаблонных строк без интерполяции
             * @example ❌ `${'hello'}` → ✅ 'hello'
             */
            "no-template-curly-in-string": "error",

            /**
             * Запрещает использование переменных до их объявления
             * @param {Object} options - настройки правила
             * @param {boolean} options.functions - разрешать использование функций до объявления
             */
            "no-use-before-define": ["error", { functions: false }],

            /**
             * Обнаруживает бесполезные присваивания переменным
             * @example ❌ let x = 1; x = 2; → ✅ let x = 2;
             */
            "no-useless-assignment": "error",

            // ===== Suggestions =====
            /**
             * Требует определения геттеров и сеттеров парами
             */
            "accessor-pairs": "error",

            /**
             * Требует использования краткого синтаксиса стрелочных функций
             * @param {string} option - "as-needed" разрешает block body только при необходимости
             */
            "arrow-body-style": ["error", "as-needed"],

            /**
             * Требует использования camelCase для имён переменных и функций
             * @example ❌ my_variable → ✅ myVariable
             */
            camelcase: "error",

            /**
             * Требует использования фигурных скобок для всех блоков
             * @example ❌ if (x) doSomething(); → ✅ if (x) { doSomething(); }
             */
            curly: "error",

            /**
             * Требует использования строгого равенства (=== и !==)
             * @param {string} option - "always" запрещает == и !=
             */
            eqeqeq: ["error", "always"],

            /**
             * Запрещает использование alert()
             * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Window/alert}
             */
            "no-alert": "error",

            /**
             * Запрещает использование console.* методов в продакшен-коде
             * @see {@link https://eslint.org/docs/rules/no-console}
             */
            "no-console": "error",

            /**
             * Запрещает вложенные тернарные операторы для улучшения читаемости
             * @example ❌ a ? b : c ? d : e → ✅ использовать if/else
             */
            "no-nested-ternary": "error",

            /**
             * Запрещает присваивание в возвращаемом выражении
             * @example ❌ return x = 5; → ✅ x = 5; return x;
             */
            "no-return-assign": "error",

            /**
             * Запрещает объявление переменных с именами, перекрывающими переменные из внешней области
             * @param {Object} options - настройки правила
             * @param {string} options.hoist - уровень проверки: "all" | "functions" | "never"
             */
            "no-shadow": ["error", { hoist: "all" }],

            /**
             * Запрещает избыточные тернарные операторы
             * @example ❌ a ? true : false → ✅ !!a
             */
            "no-unneeded-ternary": "error",

            /**
             * Запрещает выражения, которые не имеют побочных эффектов
             * @example ❌ if (0) {} → удалить или исправить условие
             */
            "no-unused-expressions": "error",

            /**
             * Запрещает бесполезную конкатенацию строк
             * @example ❌ 'a' + 'b' → ✅ 'ab'
             */
            "no-useless-concat": "error",

            /**
             * Запрещает бесполезные return в конце функций
             * @example ❌ function f() { doSomething(); return; } → ✅ function f() { doSomething(); }
             */
            "no-useless-return": "error",

            /**
             * Запрещает использование var, требует let/const
             * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/var}
             */
            "no-var": "error",

            /**
             * Требует использования стрелочных функций вместо функций-выражений с function
             * @example ❌ const f = function() {} → ✅ const f = () => {}
             */
            "prefer-arrow-callback": "error",

            /**
             * Требует использования const для переменных, которые не переназначаются
             * @example ❌ let x = 1; → ✅ const x = 1;
             */
            "prefer-const": "error",

            /**
             * Требует использования шаблонных строк вместо конкатенации
             * @example ❌ 'Hello, ' + name → ✅ `Hello, ${name}`
             */
            "prefer-template": "error",

            /**
             * Требует указания основания системы счисления в parseInt()
             * @example ❌ parseInt('10') → ✅ parseInt('10', 10)
             */
            radix: "error"
        }
    },
    {
        // Игнорировать сторонние библиотеки и сгенерированные файлы
        ignores: ["node_modules/**", "threeJS/**", "dist/**", "build/**"]
    }
];