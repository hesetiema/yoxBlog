---
title: "译《Understanding ECMAScript 6》中"
date: 2022-07-13T09:42:53+08:00
draft: false
---

个人部分翻译 《Understanding ECMAScript 6》 文章的中部部分如下。

## 扩展的对象功能

### `Object.is()` 方法

`ES6` 引入了 `Object.is()` 方法来弥补严格相等运算符残留的怪异缺陷。在许多情况下，`===`   与 `Object.is()` 运算符的工作方式相同，其对应的相等比较算法分别为 `IsStrictlyEqual` 和 `SameValue`。 对于后者，`+0` 和 `-0` 被认为是不等价的，而 `NaN` 被认为与 `NaN` 等价。

### 自有属性的枚举顺序

对象自有属性枚举时，整数属性会优先被进行排序，其他属性则按照创建的顺序显示。

```javascript
let codes = {
  49: "Germany",
  41: "Switzerland",
  44: "Great Britain",
  string02: "string2",
  string01: "string1",
  1.2: "1.2",
  "1.0": "1.0",
  // ..,
  1: "USA",
};

for (let code in codes) {
  console.log(code); // 1, 41, 44, 49 ,string02, string01, 1.2, 1.0
}
```

### 更强大的原型

- 修改对象的原型：`Object.setPrototypeOf()` 方法允许修改任意指定对象的原型，它接受两个参数：需要被修改原型的对象，以及将会成为前者原型的对象
- 使用 `super` 引用原型：`super` 可理解为指向当前对象的原型的一个指针

```javascript
const obj1 = {
  method1() {
    console.log("method 1");
  },
};

const obj2 = {
  method2() {
    super.method1();
  },
};

Object.setPrototypeOf(obj2, obj1);
obj2.method2(); // logs "method 1"
```

## 解构赋值

- 对象解构：圆括号标示了内部的花括号并不是块语句、而应该被解释为表达式，从而完成赋值操作

```javascript
let node = {
  type: "Identifier",
};
({ type: localType, name: localName = "foo" } = node);

console.log(localType); // "Identifier"
console.log(localName); // "foo"
```

- 数组解构：不必将表达式包含在圆括号内

```javascript
let colors = ["red", ["green", "lightgreen"], "blue"];

[, [secondColor], ...rest] = colors;

console.log(secondColor); // "green"
console.log(rest); // ['blue']
```

- 参数解构：提供了更清楚标明函数期望输入的替代方案。它使用对象或数组解构的模式替代了具名参数

```javascript
function setCookie(
  name,
  value,
  {
    secure,
    path = "/",
    domain = "example.com",
    expires = new Date(Date.now() + 360000000),
  } = {}
) {
  // 但第三个参数不能传入 null，否则解构报错，因此可替换第三个参数为具名参数，内部再解构
  // let { secure, path, domain, expires } = options || {};
  // ...
}
```

## Symbol

> 根据规范，只有两种原始类型可以用作对象属性键：字符串类型，`symbol` 类型。否则，如果使用另一种类型，例如数字，它会被自动转换为字符串。

- 对象添加唯一的隐藏属性键：`symbol` 值表示唯一的标识符，即使具有相同描述的 `symbol`，它们的值也是不同。添加的 `symbol` 属性将受到保护，防止被意外使用或重写

```javascript
// id1，id2 是描述为 "id" 的 symbol
let id1 = Symbol("id");
let id2 = Symbol("id");

console.log(id1 == id2); // false
console.log(id1.toString()); // 'Symbol(id)'
console.log(id1.description); // 'id'

// 作为对象的键，使用计算属性
let user = {
  name: "John",
  [id1]: 123, // 而不是 "id1"：123
};
```

- 改变一些内建行为：`JavaScript` 许多系统 `symbol` 可以作为 `Symbol.*` 访问。可用 `Symbol.iterator` 来进行迭代操作，使用 `Symbol.toPrimitive` 来设置对象原始值的转换等

## Set、Map

> `ES6` 之前，`JavaScript` 在其大部分历史中只有一种类型的集合，由 `Array` 类型表示，缺少其他集合选项，意味着数组也经常被用作队列和堆栈。

### Set

`Set` 是一组唯一值的集合。在 `Set` 内部的比较使用了 `Object.is()` 方法，具体算法应该是 `SameValueZero`，来判断两个值是否相等，唯一的例外是 `+0` 与 `-0` 在 `Set` 中被判断为是相等的。转换为数组例如 `[...new Set([+0,-0])]`

### WeakSet

对象存储在 `Set` 的一个实例中，实际上相当于存储在变量中。只要对于 `Set` 实例的引用仍然存在，所存储的对象就无法被垃圾回收机制回收，从而无法释放内存。`WeakSet` 类型只允许存储对象弱引用，弱引用在它成为该对象的唯一引用时，不会阻止垃圾回收。一般来说，若只想追踪对象的引用，应当使用 `WeakSet` 而不是 `Set`。特性如下：

- 不可迭代
- 无 `length` 属性

### Map

`Map` 是一组键值对的有序集合，`Map` 实例会维护键值对的插入顺序，而键和值都可以是任意类型。通常可以使用对象作为键。

### WeakMap

`WeakMap` 是类似于 `Map` 的集合，它仅允许对象作为键，并且一旦通过其他方式无法访问这些对象，垃圾回收便会将这些对象与其关联值一同删除。其他特性与 `WeakSet` 一样。必须注意的是，`WeakMap` 的键才是弱引用，而值不是。在 `WeakMap` 的值中存储对象，就算该对象的其他引用已全都被移除，也会阻止垃圾回收

## 注解

### Javascript 相等比较算法

> - `IsLooselyEqual (==)`：宽松相等
> - `IsStrictlyEqual (===)`: 严格相等。通常用于 `Array.prototype.indexOf`, `Array.prototype.lastIndexOf` 和 `case-matching`
> - `SameValueZero`: 同值为零比较。常用于 `%TypedArray%` 和 `ArrayBuffer` 构造函数、以及 `Map`、`Set`、`String.prototype.includes`
> - `SameValue (Object.is)`: 同值比较。用于所有其他地方

## 参考资料

- [Object (对象) ：基础知识](https://zh.javascript.info/object)
- [Symbol MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol)
- [Map and Set（映射和集合）](https://zh.javascript.info/map-set)
- [JavaScript 中的相等性判断](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Equality_comparisons_and_sameness)
