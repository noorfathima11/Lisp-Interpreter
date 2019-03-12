const lispEvaluator = require('./trial')

test('defines a value', () => {
  expect(lispEvaluator('define r (10) r')).toBe('Global Object successfully updated 10')
})

(define fact (lambda (n) (if (<= n 1) (* n (fact (- n 1))) 1 )))

//inputs
(+ 1 2)
(+ 1 (- 2 0))
(- (* 2 2) (* 5 6))
(- (* 2 2) (* 5 6)
(- (* 2 2) (/ 6 6))
(< 9 0)
(<= 9 0)
(> 9 0)
(>= 9 0)
(=== 9 0)
(!== 9 0)
pi
(* 3 pi)
(+ pi pi)
(define r 10)
(if (> (* 11 11) 120) (* 7 6) oops)
(quote 2)
(quote (if (> (* 11 11) 120) (* 7 6) oops))

//do not over write
// + 1 2 3 