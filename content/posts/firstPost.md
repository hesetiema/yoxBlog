---
title: "译《Understanding ECMAScript 6》上"
date: 2022-07-11T16:53:19+08:00
draft: false
---

个人部分翻译 《Understanding ECMAScript 6》 文章的上半部分如下。

## 概述

本书的 13 章中的每一章都涵盖了 ECMAScript 6 的不同方面。许多章节都从讨论 ECMAScript 6 更改所要解决的问题开始

- let, const 的块绑定，var 的块级替换
- 字符串、正则表达式、模板字符串
- 箭头函数、默认参数、剩余参数等
- 对象字面量的更改、新的反射方法
- 对象和数组解构
- Symbols 和 Symbol 属性
- Sets、Maps 集合类型
- Iterators 迭代器、Generators 生成器
- Class 类
- 数组的新方法
- Promise 和异步编程
- Proxy 代理、Reflection 反射
- 模块定义格式

## 一、块绑定

- 声明提升 `vs` 暂时性死区：`var`声明的变量存在声明提升，而`let`, `const` 的块绑定引入词法作用域 (块级作用域)，即在给定块范围之外无法访问变量的声明，若强制访问，则将触发暂时性死区(TDZ)导致错误。
- 循环最后迭代访问 `vs` 循环当前迭代访问 ：对于 `let` ，`for-in` 和 `for-of` 循 ​ 环都会在循环的每次迭代中创建一个新的绑定。这意味着在循环体内创建的函数可以在当前迭代期间访问循环绑定值，而不是在循环的最终迭代之后（使用 `var` 的行为）
- 最佳实践：默认使用 `const` 且仅在变量的值需更改时才使用 `let`

## 二、字符串与正则表达式

> 代理对：Unicode 中的表情符号等具有非常高的码位值，因此无法存储在两个字节（16 位）中，需要将它们编码为两个 `UTF-16` 字符（4 个字节），这些被称为代理对
>
> ```javascript
>  function is32Bit(c) {
>    return c.codePointAt(0) > 0xFFFF;
>  }
>  console.log(is32Bit("𠮷"));         // true
>  console.log(is32Bit("a"));          // false
>  ```
>
> DSL ：领域特定语言，一种为特定的、狭隘目的而设计的编程语言，与通用语言相反

- 完整的 `Unicode` 支持：使用 `UTF-16` 对其字符串进行编码，即两个字节（16 位）用于表示一个码位。
  - 在码位值和字符串间转化：`codePointAt()`、`fromCodePoint()`
  - 将当前字符串按照指定的 `Unicode` 规范形式规范化：`normalize()`

  ```javascript
    let string1 = '\u00F1';            // ñ
    let string2 = '\u006E\u0303';      // ñ

    console.log(string1 === string2); // false
    console.log(string1.length);      // 1
    console.log(string2.length);      // 2

    let string3 = string1.normalize('NFD');
    let string4 = string2.normalize('NFD');

    console.log(string3 === string4); // true
    console.log(string3.length);      // 2
    console.log(string4.length);      // 2
  ```

- 模板字符串支持：提供了用于创建领域特定语言 (`DSL`) 的语法
  - 带标签的模板字符串：即可以用函数解析模板字符串。标签函数的第一个参数包含一个字符串值的数组。其余的参数与表达式相关。最后函数可返回处理好的的字符串
  
  ```javascript
  const person = 'Mike';
  const age = 28;

  function myTag(strings, personExp, ageExp) {
    const str0 = strings[0]; // "That "
    const str1 = strings[1]; // " is a "
    const str2 = strings[2]; // "."

    const ageStr = ageExp > 99 ? 'centenarian' : 'youngster';
    // We can even return a string built using a template literal
    return `${str0}${personExp}${str1}${ageStr}${str2}`;
  }

  const output = myTag`That ${ person } is a ${ age }.`;
  console.log(output);// That Mike is a youngster.
  ```

  - 处理原始字符串值: 通过 `String.rawˋtemplateStringˋ` 方法输出含字符转义的代码的字符串

  ```javascript
  String.raw`Hi\n${2 + 3}!`;
  // 'Hi\\n5!'，Hi 后面的字符不是换行符，\ 和 n 是两个不同的字符
  ```

## 三、函数

> 函数的长度取第一个默认参数前的形参个数，不包括剩余参数个数。`arguments.length` 是函数被调用时实际传参的个数

### 默认参数

使用 `ECMAScript 6` 默认参数值的函数中的 `arguments` 对象将始终以与 `ECMAScript 5` 严格模式相同的方式运行，无论该函数是否显式地在严格模式下运行。

- 默认参数值：存在时触发`arguments` 对象与命名参数分离

```javascript
// not in strict mode
function mixArgs(first, second = "b") {
    console.log(arguments.length);        //1
    console.log(first === arguments[0]);  //true
    console.log(second === arguments[1]); //false
    first = "c";
    second = "d"
    console.log(first === arguments[0]);  //false
    console.log(second === arguments[1]); //false
}

mixArgs("a"); // arguments[1] === undefined 
console.log(mixArgs.length) // 1
```

- 默认参数表达式：仅当函数未传递对应的实参时，才开始调用默认参数表达式，而非函数声明第一次解析时就开始调用。
  - 前参数作为后参数的默认参数依赖：
  
  ```javascript
  function getValue(value) {
      return value + 5;
  }

  function add(first, second = getValue(first)) {
      return first + second;
  }

  console.log(add(1, 1));     // 2
  console.log(add(1));        // 7
  ```

  - 默认参数的暂时性死区(`TDZ`)：函数参数有自己的作用域和独立于函数体作用域的 `TDZ`，即默认参数值不能访问函数体内声明的任何变量。

  ```javascript
  // 强制后参数作为前参数的默认参数依赖，会触发TDZ
  function add(first = second, second) {
    return first + second;
  }

  console.log(add(1, 1));         // 2
  console.log(add(undefined, 1)); // throws error
  ```

### 剩余参数

剩余参数由具名参数前面的三个点 (...) 表示。该具名参数成为一个数组，其中包含传递给函数的其余参数，这是名称“`rest`”参数的来源。

- 限制一：函数仅能存在一个剩余参数，且剩余参数必须在最后的位置
- 限制二：在对象字面量设置器中不能使用剩余参数

### 箭头函数

被设计用来代替匿名函数表达式。 箭头函数具有更简洁的语法，但不能更改其 this 绑定，因此不能用作构造函数。

- 无 this 绑定：箭头函数中 this 的值只能通过查找作用域链来确定。 如果箭头函数包含在非箭头函数中，这将与包含函数相同； 否则， this 等价于全局范围内的 this 的值
- 无参数对象：虽然箭头函数无参数对象，但可通过包含函数访问

```javascript
function createArrowFunctionReturningFirstArg() {
    return () => arguments[0];
}

const arrowFunction = createArrowFunctionReturningFirstArg(5);

console.log(arrowFunction());       // 5
```

## 注解

### ASCII

> ASCII，aka American Standard Code for Information Interchange。基础 ASCII，含0-9、A-Z、a-z、英文标点符号、33 个非打印控制代码(如回车 CR、换行 LF和制表符），将 128 个指定字符编码为 7 位整数，用 7 比特的二进制来表示这个整数，且通常会额外使用一个扩充的比特，以便于以1个字节的方式存储。

### Code Point

> 编码空间（encoding space）是包含所有字符的表的维度。
>
> 码位 (Code Point)，编码空间中的一个位置，一个字符所占用的码位称为码位值。 例如，基础 ASCII 码包含128个码位，范围是0(16进制)到7F(16进制)，而   Unicode 码空间划分为17个Unicode字符平面（BMP 基本多语言平面，16个辅助平面），每个平面有65,536个码位。因此Unicode码空间总计是17 × 65,536 = 1,114,112.

### Code Unit

> 码元（Code Unit，也称代码单元）是指一个已编码的文本中具有最短的比特组合的单元。Unicode 的实现方式称为 Unicode 转换格式（Unicode Transformation Format，简称为 UTF），对于UTF-8来说，码元是8比特长；对于UTF-16来说，码元是16比特长；

## 参考资料

- [Understanding ECMAScript 6](https://leanpub.com/understandinges6/read)
- [ASCII wiki](https://zh.wikipedia.org/wiki/ASCII)
- [Unicode wiki](https://zh.wikipedia.org/wiki/Unicode)
- [UTF-16 wiki](https://zh.wikipedia.org/wiki/UTF-16)
- [UTF-8, UTF-16, UTF-32 & BOM](http://www.unicode.org/faq//utf_bom.html)
- [What is a surrogate pair in Unicode?](https://www.quora.com/What-is-a-surrogate-pair-in-Unicode?share=1)
- [模板字符串](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Template_literals)
- [Function.length](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Function/length)