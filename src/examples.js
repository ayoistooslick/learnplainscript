// Playground specimens. Every program in this file is executed against
// plainscript-lang@2.3.1 by `node scripts/check-examples.js`.
export const playgroundExamples = [
  {
    id: 'hello',
    label: 'Hello, world',
    note: 'The smallest complete program: one directive, one import, one call.',
    code: `#syntax 2.1

import { print } from "std/io"

print("Hello, world.")`,
  },
  {
    id: 'values',
    label: 'Values and state',
    note: 'Immutable bindings use value. Mutable bindings use set and change.',
    code: `#syntax 2.1

import { print } from "std/io"

value author is "Ayodele"
set count to 0

change count to count + 1
change count to count + 1

print("{author} counted {count} revisions.")`,
  },
  {
    id: 'records',
    label: 'Records',
    note: 'A record names a shape. The checker follows the fields.',
    code: `#syntax 2.1

import { print } from "std/io"

type Person
    name: text
    age: number
end

value person: Person is { name: "Ada", age: 36 }
print("{person.name} is {person.age}.")`,
  },
  {
    id: 'lists',
    label: 'Lists and maps',
    note: 'A typed list and a small transformation from the standard library.',
    code: `#syntax 2.1

import { print } from "std/io"
import { map } from "std/list"

value numbers: list of number is [1, 2, 3]
value doubled is map(numbers, (number: number) => number * 2)

print(doubled)`,
  },
  {
    id: 'optional',
    label: 'Optional values',
    note: 'An optional is narrowed before it is used as a number.',
    code: `#syntax 2.1

import { print } from "std/io"

define findScore(found: boolean) returns number?
    when found
        return 42
    end
    return nothing
end

value score is findScore(true)

when score is number
    print("Score: {score}")
end`,
  },
  {
    id: 'regex',
    label: 'Regular expressions',
    note: 'Regex literals are native values, validated by the compiler.',
    code: `#syntax 2.1

import { print } from "std/io"

value numberPattern is /^[0-9]+$/

print(numberPattern.test("2026"))
print(numberPattern.test("twenty"))`,
  },
  {
    id: 'classes',
    label: 'Classes (2.3)',
    note: 'The 2.3 object model: fields, a constructor, and a typed method.',
    code: `import { print } from "std/io"

class Counter
    value: number
    constructor(start: number)
        this.value = start
    end
    function next() -> number
        this.value += 1
        return this.value
    end
end

let counter = new Counter(2)
print(counter.next())
print(counter.next())`,
  },
  {
    id: 'generators',
    label: 'Generators (2.3)',
    note: 'A generator yields lazily and is consumed by a for loop.',
    code: `import { print } from "std/io"

generator function pages(first: number, last: number) -> number
    let page = first
    while page <= last
        yield page
        page += 1
    end
end

for page in pages(1, 3)
    print("page {page}")
end`,
  },
  {
    id: 'errors',
    label: 'Typed errors (2.3)',
    note: 'A throws contract names the class a function may raise.',
    code: `import { print } from "std/io"

class AppError extends Error
    code: number
    constructor(message: text, code: number)
        super(message)
        this.code = code
    end
end

function fail(code: number) throws AppError
    throw new AppError("failed", code)
end

try
    fail(7)
catch error: AppError
    print("{error.message} {error.code}")
end`,
  },
];

export const homepageSpecimen = `#syntax 2.1

import { print } from "std/io"

define greet(name: text) returns text
    return "Hello, {name}."
end

print(greet("reader"))`;
