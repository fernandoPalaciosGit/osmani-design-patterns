'use strict';

let getReflect = require('./../../main/ecma2015/reflect'),
    expect = require('chai').expect;

describe('Ecma 2015 - Reflect, reflection through introspection', function () {
    expect(getReflect).to.be.an('object');

    context('Reflection to access internal methods: specs of JS engine', function () {
    });

    context('Reflection to override internal methods', function () {
        it('Reflect.apply: drives method of Function#apply', function (next) {
            let array = [7, 1, 45, 98, 3], min = 1, max = 98, type = '[object Array]';

            expect(Math.max.apply(Math, array)).to.be.equals(max);
            expect(Math.min.apply(Math, array)).to.be.equals(min);
            expect(Object.prototype.toString.apply(array)).to.be.equals(type);
            expect(Reflect.apply(Math.max, Math, array)).to.be.equals(max);
            expect(Reflect.apply(Math.min, Math, array)).to.be.equals(min);
            expect(Reflect.apply(Object.prototype.toString, array, [])).to.be.equals(type);
            next();
        });

        it('Reflect.construct: call a Constructor with a set of arguments.', function (next) {
            class Greeting {
                constructor (options) {
                    this.greet = options.greet || '';
                }

                say () {
                    return `Hello ${this.greet}`;
                }
            }

            let oldFactoryGreet = (options = {}) => new Greeting(options),
                newFactoryGreet = (options = {}) => Reflect.construct(Greeting, [options]),
                testGreet;

            testGreet = oldFactoryGreet({ greet: 'my darling' });
            expect(testGreet).to.be.an.instanceof(Greeting);
            expect(testGreet.say()).to.be.equals('Hello my darling');

            testGreet = newFactoryGreet({ greet: 'my darling' });
            expect(testGreet.say()).to.be.equals('Hello my darling');
            expect(testGreet).to.be.an.instanceof(Greeting);
            next();
        });

        // "Object.defineProperty" is @deprecated
        it('Reflect.defineProperty: lets you define metadata about a propert, that it acts on object literals', function (next) {
            let now = new Date(), myDate;

            expect(function () {
                Reflect.defineProperty(1, 'test', {});
            }).to.throw(TypeError/*'Reflect.defineProperty called on non-object'*/);

            class MyDate {
            }

            Object.defineProperty(MyDate.prototype, 'nowDateByObject', {
                value: now
            });
            // New Style, not weird because Reflect does Reflection.
            Reflect.defineProperty(MyDate.prototype, 'nowDateByReflection', {
                value: now
            });
            myDate = new MyDate();
            expect(myDate).to.be.an.instanceof(MyDate);
            expect(myDate.nowDateByObject).to.be.equals(now);
            expect(myDate.nowDateByReflection).to.be.equals(now);
            next();
        });

        // "Object.getOwnPropertyDescriptor" is @deprecated
        it('Reflect.getOwnPropertyDescriptor: getting the descriptor metadata of a property', function (next) {
            let testObject = {}, testArray = [];

            expect(function () {
                Reflect.getOwnPropertyDescriptor(1, 'test', {});
            }).to.throw(TypeError/*'Reflect.getOwnPropertyDescriptor called on non-object'*/);

            Reflect.defineProperty(testObject, 'hidden', {
                value: true,
                enumerable: false // not shows up during enumeration of the properties
            });

            for (let property in testObject) {
                if (testObject.hasOwnProperty(property)) { // iterate over not prototype (inherit properties)
                    testArray.push(property);
                }
            }

            expect(testArray).not.to.include('hidden');

            let testObjectDescriptor = Reflect.getOwnPropertyDescriptor(testObject, 'hidden');

            expect(testObjectDescriptor).to.have.property('value', true);
            expect(testObjectDescriptor).to.have.property('enumerable', false);
            next();
        });

        // "delete object.property" is @deprecated
        it('Reflect.deleteProperty: drives the behavior of "delete object.property"', function (next) {
            let testObject = {
                foo: 'foo',
                bar: 'bar'
            };

            delete testObject.foo;
            expect(testObject).not.to.have.property('foo');
            Reflect.deleteProperty(testObject, 'bar');
            expect(testObject).not.to.have.property('bar');
            next();
        });

        // "Object.getPrototypeOf" is @deprecated
        it('Reflect.getPrototypeOf: return the prototype reference of an object', function (next) {
            class Test {
            }

            let testObject = new Test();

            expect(Object.getPrototypeOf(testObject)).to.deep.equal(Test.prototype);
            expect(Reflect.getPrototypeOf(testObject)).to.deep.equal(Test.prototype);
            expect(function () {
                Reflect.getPrototypeOf(1);
            }).to.throw(TypeError/*'Reflect.getPrototypeOf called on non-object'*/);
            next();
        });

        // "Object.setPrototypeOf" is @deprecated, easy to manage because not throwing errors only retur boolean on operation
        /*todo: babel not supported*/
        it.skip('Reflect.setPrototypeOf: drives the behavior of Object.setPrototypeOf', function (next) {
            let objectTest;

            class Test {
            }

            class OtherTest {
            }

            objectTest = new Test();
            expect(Reflect.getPrototypeOf(objectTest)).to.deep.equal(Test.prototype);
            expect(Reflect.setPrototypeOf(objectTest, OtherTest.prototype)).to.be.true;
            expect(Reflect.getPrototypeOf(objectTest)).to.deep.equal(OtherTest.prototype);
            expect(function () {
                Reflect.setPrototypeOf(1, {});
            }).to.throw(TypeError/*'Reflect.setPrototypeOf called on non-object'*/);

            objectTest = new Test();
            Object.freeze(objectTest);
            expect(Reflect.setPrototypeOf(objectTest, OtherTest.prototype)).to.be.false;
            next();
        });

        context('Reflect.isExtensible (target)', function () {
            let testObject;

            beforeEach(function () {
                testObject = {};
                expect(Reflect.isExtensible(testObject)).to.equals(true);
            });

            afterEach(function () {
                expect(Reflect.isExtensible(testObject)).to.equals(false);
                expect(function () {
                    testObject.test = 1;
                }).to.throw(TypeError/*Can't add property test, object is not extensible, Attempted to assign to readonly property*/);
                expect(testObject).not.to.have.property('test');
            });

            it('Reflect.preventExtensions', function (next) {
                Reflect.preventExtensions(testObject);
                next();
            });

            it('Object.seal', function (next) {
                Object.seal(testObject);
                next();
            });

            it('Object.freeze', function (next) {
                Object.freeze(testObject);
                next();
            });
        });

        context('Reflect.get ( target, propertyKey [ , receiver ])', function () {
            let testObject, testBindObject;

            before(function () {
                testObject = {
                    foo: 1,
                    bar: 2,
                    get beer () {
                        return this.foo + this.bar;
                    }
                };
                testBindObject = {
                    get beer () {
                        return `This is ${this.foo + this.bar}`;
                    }
                };
            });

            it('calls target[propertyKey]', function (next) {
                expect(Reflect.get(testObject, 'foo')).to.equals(1);
                expect(Reflect.get(testObject, 'bar')).to.equals(2);
                expect(Reflect.get(testObject, 'beer')).to.equals(3);
                next();
            });

            it('third argument binds context', function (next) {
                expect(Reflect.get(testBindObject, 'beer', testObject)).to.equals('This is 3');
                next();
            });

            it('if target is a non-object, the function call will throw TypeError', function (next) {
                expect(function () {
                    Reflect.get(1, 'foo');
                }).to.throw(TypeError);
                next();
            });

            it('old style do not throw error', function (next) {
                expect(1['foo']).to.be.undefined; // eslint-disable-line dot-notation
                next();
            });
        });
    });
});
