import { QuizQuestion } from '../types';

export interface LanguageOption {
  id: string;
  label: string;
  icon: string;
  category: string;
}

export const LANGUAGE_TEST_OPTIONS: LanguageOption[] = [
  { id: 'all', label: 'All Languages & Skills (Comprehensive Mix)', icon: '🌐', category: 'General' },
  { id: 'Python', label: 'Python (Syntax, OOP, Collections)', icon: '🐍', category: 'Backend & Data' },
  { id: 'JavaScript', label: 'JavaScript & TypeScript (ES6+, Async, DOM)', icon: '⚡', category: 'Web & Full Stack' },
  { id: 'Java', label: 'Java (OOP, Collections, JVM, Concurrency)', icon: '☕', category: 'Backend & Systems' },
  { id: 'C++', label: 'C++ & C (Pointers, Memory, STL, OOP)', icon: '⚙️', category: 'Systems & Core' },
  { id: 'SQL', label: 'SQL & Relational Databases (Joins, Indexing, DDL/DML)', icon: '🗄️', category: 'Databases' },
  { id: 'HTML/CSS', label: 'HTML5 & CSS3 (Flexbox, Grid, Semantics)', icon: '🎨', category: 'Frontend' },
  { id: 'React', label: 'React (Hooks, Lifecycle, State, Virtual DOM)', icon: '⚛️', category: 'Frontend' },
  { id: 'Git', label: 'Git & Version Control (Branching, Merge, Rebase)', icon: '🐙', category: 'Tools' },
  { id: 'Linux', label: 'Linux & Shell Scripting (Bash, Permissions, CLI)', icon: '🐧', category: 'DevOps & SysAdmin' },
  { id: 'Docker', label: 'Docker & DevOps (Containers, Images, Compose)', icon: '🐳', category: 'DevOps' },
  { id: 'DSA', label: 'Data Structures & Algorithms (Trees, Graphs, Sorting)', icon: '🌲', category: 'Computer Science' },
  { id: 'Machine Learning', label: 'Machine Learning & AI (Models, Metrics, Prep)', icon: '🤖', category: 'AI / Data' },
  { id: 'Data Engineering', label: 'Data Engineering (ETL, Pipelines, PySpark, Airflow)', icon: '📊', category: 'Big Data' }
];

export const COMPREHENSIVE_QUESTION_BANK: QuizQuestion[] = [
  // ---------------- PYTHON QUESTIONS ----------------
  {
    id: 'py-1',
    skill: 'Python',
    level: 'Beginner',
    question: 'What does len([1, 2, 3]) return?',
    options: ['2', '3', '4', 'Error'],
    correctOptionIndex: 1,
    explanation: 'The len() function returns the number of items in a container or sequence. [1, 2, 3] has 3 items.'
  },
  {
    id: 'py-2',
    skill: 'Python',
    level: 'Intermediate',
    question: 'Which structure stores unique items and provides O(1) average lookup time?',
    options: ['list', 'tuple', 'set', 'string'],
    correctOptionIndex: 2,
    explanation: 'A set is an unordered collection of distinct hashable objects, ensuring all elements are unique with O(1) lookup.'
  },
  {
    id: 'py-3',
    skill: 'Python',
    level: 'Beginner',
    question: 'What is the output of print(type({})) in Python 3?',
    options: ["<class 'list'>", "<class 'dict'>", "<class 'set'>", "<class 'tuple'>"],
    correctOptionIndex: 1,
    explanation: 'Empty curly braces {} create an empty dictionary. To create an empty set, set() must be used.'
  },
  {
    id: 'py-4',
    skill: 'Python',
    level: 'Intermediate',
    question: 'What is the difference between a list and a tuple in Python?',
    options: [
      'Lists are immutable, tuples are mutable',
      'Lists are mutable, tuples are immutable',
      'Tuples can only store numbers',
      'Lists cannot contain mixed data types'
    ],
    correctOptionIndex: 1,
    explanation: 'Lists can be modified after creation (mutable), whereas tuples cannot be changed once declared (immutable).'
  },
  {
    id: 'py-5',
    skill: 'Python',
    level: 'Advanced',
    question: 'What does the @classmethod decorator do to a method in Python?',
    options: [
      'Passes the instance (self) as the first parameter',
      'Passes the class (cls) as the first parameter instead of the instance',
      'Makes the method private and inaccessible from outside',
      'Executes the method concurrently in a worker thread'
    ],
    correctOptionIndex: 1,
    explanation: '@classmethod receives the class object cls as its first argument, allowing factory constructor patterns.'
  },
  {
    id: 'py-6',
    skill: 'Python',
    level: 'Intermediate',
    question: 'What will list(filter(lambda x: x % 2 == 0, [1, 2, 3, 4])) return?',
    options: ['[1, 3]', '[2, 4]', '[0, 2, 4]', '[True, False, True, False]'],
    correctOptionIndex: 1,
    explanation: 'filter extracts elements where the predicate returns True; x % 2 == 0 matches even numbers 2 and 4.'
  },

  // ---------------- JAVASCRIPT & TYPESCRIPT ----------------
  {
    id: 'js-1',
    skill: 'JavaScript',
    level: 'Beginner',
    question: 'What is the difference between "==" and "===" in JavaScript?',
    options: [
      'They are identical aliases in modern ECMAScript',
      '== compares value with type coercion; === compares value and type strictly without coercion',
      '=== is used exclusively for object reference equality',
      '== is faster because it bypasses memory checks'
    ],
    correctOptionIndex: 1,
    explanation: '== performs automatic type coercion before comparing, while === (strict equality) requires identical types and values.'
  },
  {
    id: 'js-2',
    skill: 'JavaScript',
    level: 'Intermediate',
    question: 'What does Promise.all() do when one of the passed promises rejects?',
    options: [
      'It waits for all other promises to resolve and ignores the rejection',
      'It immediately rejects with that error, discarding unresolved results',
      'It retries the failed promise up to 3 times',
      'It returns null for the rejected promise and succeeds'
    ],
    correctOptionIndex: 1,
    explanation: 'Promise.all rejects immediately upon the first rejected promise (fail-fast behavior).'
  },
  {
    id: 'js-3',
    skill: 'JavaScript',
    level: 'Intermediate',
    question: 'What is a Closure in JavaScript?',
    options: [
      'A method to terminate an asynchronous fetch request',
      'A function that retains lexical access to variables from its outer enclosing scope even after the outer function has executed',
      'A syntax error caused by unclosed parentheses',
      'A design pattern to prevent DOM repaints'
    ],
    correctOptionIndex: 1,
    explanation: 'A closure is the combination of a function bundled together with references to its surrounding state (lexical environment).'
  },
  {
    id: 'js-4',
    skill: 'JavaScript',
    level: 'Advanced',
    question: 'In TypeScript, what is the key difference between an "interface" and a "type" alias?',
    options: [
      'Types can be extended with declaration merging; interfaces cannot',
      'Interfaces can be reopened and extended via declaration merging; type aliases cannot',
      'Interfaces can only describe primitive types like string or number',
      'Types only exist at runtime, while interfaces are erased during build'
    ],
    correctOptionIndex: 1,
    explanation: 'Interfaces support declaration merging (multiple declarations with the same name merge), whereas type aliases cannot be reopened.'
  },
  {
    id: 'js-5',
    skill: 'JavaScript',
    level: 'Intermediate',
    question: 'What will [1, 2, 3].map(n => n * 2) return?',
    options: ['[1, 2, 3]', '[2, 4, 6]', '6', '[true, true, true]'],
    correctOptionIndex: 1,
    explanation: 'Array.prototype.map creates a new array populated with the results of calling the function on every element.'
  },

  // ---------------- JAVA ----------------
  {
    id: 'java-1',
    skill: 'Java',
    level: 'Beginner',
    question: 'Which keyword in Java prevents a class from being inherited/subclassed?',
    options: ['static', 'final', 'abstract', 'private'],
    correctOptionIndex: 1,
    explanation: 'The "final" keyword applied to a class declaration prevents any other class from extending it.'
  },
  {
    id: 'java-2',
    skill: 'Java',
    level: 'Intermediate',
    question: 'What is the key difference between HashMap and Hashtable in Java?',
    options: [
      'Hashtable is synchronized (thread-safe) and does not permit null keys/values; HashMap is unsynchronized and permits one null key',
      'HashMap is sorted while Hashtable preserves insertion order',
      'Hashtable was introduced in Java 8 streams; HashMap is legacy',
      'HashMap cannot store custom objects'
    ],
    correctOptionIndex: 0,
    explanation: 'HashMap is unsynchronized and allows one null key. Hashtable is synchronized and throws NullPointerException on null keys.'
  },
  {
    id: 'java-3',
    skill: 'Java',
    level: 'Intermediate',
    question: 'In Java memory management, where are objects allocated versus primitive local variables?',
    options: [
      'Objects on the Heap; primitive local variables on the Stack',
      'Both are strictly stored on the JVM Heap',
      'Objects on the Stack; primitive locals in PermGen / Metaspace',
      'All variables reside directly in CPU L1 cache'
    ],
    correctOptionIndex: 0,
    explanation: 'Objects are allocated on the Heap memory, while method call frames and primitive local variables reside on the Stack.'
  },
  {
    id: 'java-4',
    skill: 'Java',
    level: 'Advanced',
    question: 'What does the "volatile" keyword guarantee in multi-threaded Java applications?',
    options: [
      'Guarantees atomic execution of compound operations like count++',
      'Guarantees visibility of changes across threads (reads/writes directly to main memory) and prevents instruction reordering',
      'Locks the monitor of the object like synchronized blocks',
      'Automatically marks the variable for garbage collection'
    ],
    correctOptionIndex: 1,
    explanation: 'volatile guarantees that any thread reading the field sees the most recent write (happens-before visibility) without acquiring object locks.'
  },
  {
    id: 'java-5',
    skill: 'Java',
    level: 'Beginner',
    question: 'Which interface in Java Collections Framework guarantees unique elements with no duplicates?',
    options: ['List', 'Queue', 'Set', 'Map'],
    correctOptionIndex: 2,
    explanation: 'The java.util.Set interface models the mathematical set abstraction and rejects duplicate elements.'
  },

  // ---------------- C++ & C ----------------
  {
    id: 'cpp-1',
    skill: 'C++',
    level: 'Beginner',
    question: 'Which operator is used to obtain the memory address of a variable in C/C++?',
    options: ['*', '&', '#', '->'],
    correctOptionIndex: 1,
    explanation: 'The ampersand & is the address-of operator, returning the memory pointer where the variable is stored.'
  },
  {
    id: 'cpp-2',
    skill: 'C++',
    level: 'Intermediate',
    question: 'In modern C++ (C++11 and later), which smart pointer represents exclusive, unique ownership of a resource?',
    options: ['std::shared_ptr', 'std::unique_ptr', 'std::weak_ptr', 'std::auto_ptr'],
    correctOptionIndex: 1,
    explanation: 'std::unique_ptr owns and manages another object through a pointer and disposes of that object when the unique_ptr goes out of scope with zero overhead.'
  },
  {
    id: 'cpp-3',
    skill: 'C++',
    level: 'Intermediate',
    question: 'What happens if you do not declare a base class destructor as "virtual" in C++ when deleting derived objects via base pointers?',
    options: [
      'Compilation fails with a linker error',
      'Undefined behavior: the derived class destructor will not execute, leading to resource leaks',
      'The derived destructor executes twice',
      'The memory is automatically garbage collected'
    ],
    correctOptionIndex: 1,
    explanation: 'Deleting a derived class through a pointer to a base class that lacks a virtual destructor causes undefined behavior, skipping derived cleanup.'
  },
  {
    id: 'cpp-4',
    skill: 'C++',
    level: 'Advanced',
    question: 'What is the time complexity of searching an element in std::unordered_map versus std::map?',
    options: [
      'std::unordered_map is O(1) average (hash table); std::map is O(log n) (Red-Black self-balancing tree)',
      'Both are strictly O(1)',
      'std::map is O(1); std::unordered_map is O(n)',
      'std::unordered_map uses a linked list with O(n) lookup'
    ],
    correctOptionIndex: 0,
    explanation: 'std::unordered_map uses a hash table offering O(1) average lookup, whereas std::map is implemented as a Red-Black BST offering O(log n).'
  },
  {
    id: 'cpp-5',
    skill: 'C++',
    level: 'Beginner',
    question: 'Which keyword in C++ is used to instantiate dynamically allocated memory on the free store (heap)?',
    options: ['alloc', 'malloc', 'new', 'create'],
    correctOptionIndex: 2,
    explanation: 'In C++, "new" allocates memory and calls the object constructor; "delete" frees it and calls the destructor.'
  },

  // ---------------- SQL & DATABASES ----------------
  {
    id: 'sql-1',
    skill: 'SQL',
    level: 'Beginner',
    question: 'Which clause in SQL is used to filter aggregated records produced by a GROUP BY clause?',
    options: ['WHERE', 'HAVING', 'ORDER BY', 'LIMIT'],
    correctOptionIndex: 1,
    explanation: 'WHERE filters individual table rows before grouping occurs; HAVING filters group results after aggregation.'
  },
  {
    id: 'sql-2',
    skill: 'SQL',
    level: 'Intermediate',
    question: 'Which JOIN returns all rows from the left table, along with matching rows from the right table (filling NULLs if no match exists)?',
    options: ['INNER JOIN', 'LEFT OUTER JOIN', 'CROSS JOIN', 'FULL JOIN only'],
    correctOptionIndex: 1,
    explanation: 'LEFT (OUTER) JOIN guarantees that every record from the left table is returned, regardless of matches in the right table.'
  },
  {
    id: 'sql-3',
    skill: 'SQL',
    level: 'Intermediate',
    question: 'Which SQL window function assigns sequential integers to rows within a partition without creating gaps for ties?',
    options: ['RANK()', 'DENSE_RANK()', 'ROW_NUMBER()', 'LEAD()'],
    correctOptionIndex: 2,
    explanation: 'ROW_NUMBER() assigns a unique ascending integer (1, 2, 3...) to each row within its partition partition without ties.'
  },
  {
    id: 'sql-4',
    skill: 'SQL',
    level: 'Advanced',
    question: 'What does the "A" in ACID transaction properties guarantee in relational databases?',
    options: [
      'Availability: the cluster always answers read requests',
      'Atomicity: all operations in the transaction succeed together, or the entire transaction is rolled back with no partial effects',
      'Asynchronous: queries run in background worker threads',
      'Authorization: only role admins can modify tables'
    ],
    correctOptionIndex: 1,
    explanation: 'Atomicity ensures that all changes within a transaction are treated as a single indivisible unit: all succeed or all are aborted.'
  },
  {
    id: 'sql-5',
    skill: 'SQL',
    level: 'Intermediate',
    question: 'What is the primary benefit of creating a B-Tree index on a frequently filtered column?',
    options: [
      'Reduces the physical disk space taken by the table',
      'Reduces query search complexity from O(N) full table scans to O(log N) tree lookups',
      'Speeds up INSERT and UPDATE operations',
      'Automatically enforces foreign key relationships'
    ],
    correctOptionIndex: 1,
    explanation: 'A B-Tree index allows the database query engine to locate target rows in logarithmic O(log N) time instead of scanning every block.'
  },

  // ---------------- HTML5 & CSS3 ----------------
  {
    id: 'web-1',
    skill: 'HTML/CSS',
    level: 'Beginner',
    question: 'Which HTML5 semantic element is intended for major navigation menus?',
    options: ['<menuitem>', '<nav>', '<header-links>', '<section>'],
    correctOptionIndex: 1,
    explanation: 'The <nav> element represents a section of a page whose purpose is to provide navigation links.'
  },
  {
    id: 'web-2',
    skill: 'HTML/CSS',
    level: 'Beginner',
    question: 'In CSS Flexbox, which property sets the primary orientation of the items?',
    options: ['flex-direction', 'align-items', 'justify-content', 'flex-wrap'],
    correctOptionIndex: 0,
    explanation: 'flex-direction specifies the direction of the main axis (row, row-reverse, column, column-reverse).'
  },
  {
    id: 'web-3',
    skill: 'HTML/CSS',
    level: 'Intermediate',
    question: 'What does the CSS "box-sizing: border-box" declaration do?',
    options: [
      'Excludes padding and border from the element specified width and height',
      'Includes padding and border within the specified element width and height',
      'Draws an automatic drop shadow border around the box',
      'Forces the element to display as an inline-block container'
    ],
    correctOptionIndex: 1,
    explanation: 'border-box includes padding and borders in the calculated width and height, preventing layout breakage.'
  },
  {
    id: 'web-4',
    skill: 'HTML/CSS',
    level: 'Intermediate',
    question: 'In CSS Grid, which rule creates 3 equal columns that adjust responsively?',
    options: [
      'grid-template-columns: repeat(3, 1fr);',
      'grid-columns: 33% 33% 33%;',
      'display: flex; flex: 3;',
      'columns: auto 3;'
    ],
    correctOptionIndex: 0,
    explanation: 'repeat(3, 1fr) allocates 3 tracks taking one fractional unit each of the available space.'
  },

  // ---------------- REACT ----------------
  {
    id: 'react-1',
    skill: 'React',
    level: 'Beginner',
    question: 'What is the primary rule when declaring React Hooks like useState or useEffect?',
    options: [
      'They must be called inside loops or conditionals to optimize memory',
      'They must only be called at the top level of React function components or custom hooks, never conditionally',
      'They can only be invoked inside class component render methods',
      'They must always return a Promise'
    ],
    correctOptionIndex: 1,
    explanation: 'Hooks rely on constant call order across renders, so they must never be placed inside loops, conditions, or nested functions.'
  },
  {
    id: 'react-2',
    skill: 'React',
    level: 'Intermediate',
    question: 'What is the purpose of the dependency array in useEffect(callback, [deps])?',
    options: [
      'It lists CSS styles to apply during the effect',
      'It tells React to re-run the effect only when one of the specified dependencies has changed between renders',
      'It imports npm packages dynamically at runtime',
      'It specifies the parent component that owns the effect'
    ],
    correctOptionIndex: 1,
    explanation: 'React compares each value in the dependency array with its previous render value (Object.is) to decide whether to re-fire the effect.'
  },
  {
    id: 'react-3',
    skill: 'React',
    level: 'Intermediate',
    question: 'Why should keys in React lists never be set to the array index when items can be reordered or removed?',
    options: [
      'React will throw a runtime fatal syntax error',
      'Index keys can lead to buggy component state persistence and unnecessary DOM repaints during reordering or deletions',
      'Index keys double the virtual DOM memory footprint',
      'Keys are deprecated in React 18+'
    ],
    correctOptionIndex: 1,
    explanation: 'Using indexes as keys causes component instances to be incorrectly reused across shifts and deletions, leading to UI state bugs.'
  },
  {
    id: 'react-4',
    skill: 'React',
    level: 'Advanced',
    question: 'What does React.useMemo() do?',
    options: [
      'Creates a memoized callback function instance',
      'Caches the calculated result of an expensive calculation between re-renders until its dependencies change',
      'Saves component data directly to browser localStorage',
      'Automatically logs render durations to Chrome DevTools'
    ],
    correctOptionIndex: 1,
    explanation: 'useMemo caches the result of a calculation between re-renders, recalculating only when dependencies change.'
  },

  // ---------------- GIT & VERSION CONTROL ----------------
  {
    id: 'git-1',
    skill: 'Git',
    level: 'Beginner',
    question: 'Which Git command records staged changes permanently into the local commit history?',
    options: ['git push', 'git commit -m "msg"', 'git add .', 'git merge'],
    correctOptionIndex: 1,
    explanation: 'git commit captures a snapshot of the project staged changes and writes it to the local repository log.'
  },
  {
    id: 'git-2',
    skill: 'Git',
    level: 'Intermediate',
    question: 'What is the conceptual difference between "git merge" and "git rebase"?',
    options: [
      'git merge deletes previous commits; git rebase keeps all branches permanently open',
      'git merge preserves the original commit history with a merge commit; git rebase rewrites project history by replaying commits atop the base branch for a linear log',
      'git rebase only works on remote repositories like GitHub',
      'git merge cannot handle conflicts'
    ],
    correctOptionIndex: 1,
    explanation: 'Merge creates a new commit joining two histories; rebase transplants a series of commits onto a new base, producing a clean linear history.'
  },
  {
    id: 'git-3',
    skill: 'Git',
    level: 'Intermediate',
    question: 'Which command temporarily shelves uncommitted dirty working directory changes so you can work on another branch?',
    options: ['git stash', 'git reset --hard', 'git checkout -b', 'git prune'],
    correctOptionIndex: 0,
    explanation: 'git stash temporarily records your modified tracked files on a stack, giving you a clean working copy.'
  },

  // ---------------- LINUX & BASH ----------------
  {
    id: 'linux-1',
    skill: 'Linux',
    level: 'Beginner',
    question: 'Which command displays the current absolute working directory in a Linux shell?',
    options: ['ls', 'pwd', 'cd ~', 'whereami'],
    correctOptionIndex: 1,
    explanation: 'pwd stands for "print working directory", returning the current path from root.'
  },
  {
    id: 'linux-2',
    skill: 'Linux',
    level: 'Intermediate',
    question: 'In Linux permissions (e.g. chmod 755 script.sh), what permissions does 7 grant to the owner?',
    options: [
      'Read only (4)',
      'Read (4) + Write (2) + Execute (1) = Full permissions (7)',
      'Write only (2)',
      'Execute and Write without Read (3)'
    ],
    correctOptionIndex: 1,
    explanation: 'Octal 7 represents 4 (read) + 2 (write) + 1 (execute), giving the file owner full permissions.'
  },
  {
    id: 'linux-3',
    skill: 'Linux',
    level: 'Intermediate',
    question: 'Which command combination searches for the phrase "DATABASE_URL" in all files under the current directory?',
    options: ['find . -name DATABASE_URL', 'grep -rn "DATABASE_URL" .', 'cat "DATABASE_URL"', 'ls -l DATABASE_URL'],
    correctOptionIndex: 1,
    explanation: 'grep -rn searches recursively (-r) with line numbers (-n) for text patterns across all directory files.'
  },

  // ---------------- DOCKER & DEVOPS ----------------
  {
    id: 'docker-1',
    skill: 'Docker',
    level: 'Beginner',
    question: 'What is the fundamental difference between a Docker Image and a Docker Container?',
    options: [
      'A container is a read-only blueprint; an image is a running instance',
      'An image is a read-only template with instructions; a container is a runnable, live instance of that image with its own writable layer',
      'Images run on Linux; containers run only on Windows',
      'They are identical terms in container theory'
    ],
    correctOptionIndex: 1,
    explanation: 'An image is the immutable packaged template; a container is the isolated executing process instantiated from that image.'
  },
  {
    id: 'docker-2',
    skill: 'Docker',
    level: 'Intermediate',
    question: 'In a Dockerfile, what is the key difference between RUN and CMD instructions?',
    options: [
      'RUN executes during image build time (installing packages); CMD specifies the default executable command when the container launches',
      'CMD runs during image build; RUN runs when launched',
      'RUN is deprecated in favor of ENTRYPOINT only',
      'CMD cannot accept parameters'
    ],
    correctOptionIndex: 0,
    explanation: 'RUN commits new layers during build time. CMD provides defaults for an executing container.'
  },

  // ---------------- DATA STRUCTURES & ALGORITHMS (DSA) ----------------
  {
    id: 'dsa-1',
    skill: 'DSA',
    level: 'Intermediate',
    question: 'What is the average time complexity of searching in a balanced Binary Search Tree (such as an AVL or Red-Black tree)?',
    options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
    correctOptionIndex: 1,
    explanation: 'Because balanced BSTs maintain height proportional to log(n), searching halves remaining candidates at each step: O(log n).'
  },
  {
    id: 'dsa-2',
    skill: 'DSA',
    level: 'Intermediate',
    question: 'Which data structure is primarily used to implement Breadth-First Search (BFS) in a graph?',
    options: ['Stack (LIFO)', 'Queue (FIFO)', 'Priority Queue', 'Disjoint Set Union'],
    correctOptionIndex: 1,
    explanation: 'BFS explores neighbor nodes level by level using a FIFO Queue.'
  },
  {
    id: 'dsa-3',
    skill: 'DSA',
    level: 'Advanced',
    question: 'What is the worst-case time complexity of QuickSort if no randomized pivot or median-of-three is used?',
    options: ['O(n)', 'O(n log n)', 'O(n^2)', 'O(log n)'],
    correctOptionIndex: 2,
    explanation: 'When picking an unbalanced pivot on already sorted arrays, QuickSort partitions into sizes 0 and n-1, degrading to O(n^2).'
  },

  // ---------------- MACHINE LEARNING & AI ----------------
  {
    id: 'ml-1',
    skill: 'Machine Learning',
    level: 'Beginner',
    question: 'In classification problems with severe class imbalance (e.g. 99% negative, 1% positive), why is raw Accuracy a misleading metric?',
    options: [
      'Accuracy cannot be calculated on binary labels',
      'A naive model predicting negative every single time scores 99% accuracy while detecting zero true positives',
      'Accuracy values can exceed 100%',
      'Gradient descent fails when accuracy is tracked'
    ],
    correctOptionIndex: 1,
    explanation: 'Under heavy imbalance, trivial majority-class classifiers achieve high accuracy. Precision, Recall, and F1-Score are required.'
  },
  {
    id: 'ml-2',
    skill: 'Machine Learning',
    level: 'Intermediate',
    question: 'What is the primary purpose of L1 (Lasso) vs L2 (Ridge) regularization?',
    options: [
      'L1 encourages sparse weights (feature selection by driving weights to zero); L2 shrinks weights smoothly without zeroing them out',
      'L2 causes weights to become zero; L1 does not',
      'L1 can only be applied to neural networks',
      'L2 eliminates the need for training validation sets'
    ],
    correctOptionIndex: 0,
    explanation: 'L1 penalty |w| produces diamond contours driving coefficients to exact zero. L2 penalty w^2 shrinks weights toward zero.'
  },

  // ---------------- DATA ENGINEERING ----------------
  {
    id: 'de-1',
    skill: 'Data Engineering',
    level: 'Beginner',
    question: 'In data warehousing, what does ETL stand for?',
    options: ['Extract, Transform, Load', 'Evaluate, Test, Launch', 'Export, Transfer, Link', 'Encrypt, Tokenize, Log'],
    correctOptionIndex: 0,
    explanation: 'ETL stands for Extract (ingest from source systems), Transform (clean and aggregate), and Load (insert into destination warehouse).'
  },
  {
    id: 'de-2',
    skill: 'Data Engineering',
    level: 'Intermediate',
    question: 'In dimensional modeling (Kimball), what does a Fact table store compared to a Dimension table?',
    options: [
      'Fact tables store measurable business events and metrics (sales, revenue); Dimension tables store descriptive context (customers, dates, stores)',
      'Fact tables store customer names; Dimension tables store credit card numbers',
      'Fact tables are unindexed text logs; Dimension tables are JSON documents',
      'Fact tables only exist in NoSQL databases'
    ],
    correctOptionIndex: 0,
    explanation: 'Fact tables hold quantitative measurements and foreign keys referencing dimension tables which hold descriptive context.'
  },
  {
    id: 'de-3',
    skill: 'Data Engineering',
    level: 'Intermediate',
    question: 'What is Apache Airflow primarily used for in modern data engineering stacks?',
    options: [
      'Serving frontend web applications',
      'Authoring, scheduling, and monitoring programmatic data pipelines orchestrated as Directed Acyclic Graphs (DAGs)',
      'Training deep neural networks on GPU clusters',
      'Replacing relational SQL databases'
    ],
    correctOptionIndex: 1,
    explanation: 'Airflow is a workflow orchestration platform to author, schedule, and monitor task dependencies via Python DAGs.'
  },
  {
    id: 'de-4',
    skill: 'Data Engineering',
    level: 'Intermediate',
    question: 'What is an RDD (Resilient Distributed Dataset) in Apache Spark?',
    options: [
      'A physical SSD hard drive connected to a cluster',
      'A fault-tolerant collection of operational elements that can be partitioned and processed in parallel across cluster nodes',
      'A relational database trigger in PostgreSQL',
      'A visual dashboard plugin for Apache Kafka'
    ],
    correctOptionIndex: 1,
    explanation: 'RDD is the fundamental data abstraction in Spark: an immutable, partitioned, fault-tolerant collection evaluated lazily.'
  }
];

// Helper to get questions for a specific language/skill
export function getQuestionsForLanguage(languageKey: string): QuizQuestion[] {
  if (!languageKey || languageKey === 'all') {
    return COMPREHENSIVE_QUESTION_BANK;
  }
  const keyLower = languageKey.toLowerCase();
  const matched = COMPREHENSIVE_QUESTION_BANK.filter((q) => {
    const skillLower = q.skill.toLowerCase();
    if (keyLower === 'javascript' || keyLower === 'typescript' || keyLower === 'js') {
      return skillLower.includes('javascript') || skillLower.includes('typescript') || skillLower === 'js';
    }
    if (keyLower === 'c++' || keyLower === 'cpp' || keyLower === 'c') {
      return skillLower.includes('c++') || skillLower === 'c';
    }
    if (keyLower === 'html/css' || keyLower === 'html' || keyLower === 'css') {
      return skillLower.includes('html') || skillLower.includes('css');
    }
    if (keyLower === 'react') {
      return skillLower.includes('react');
    }
    if (keyLower === 'python') {
      return skillLower.includes('python');
    }
    if (keyLower === 'java') {
      return skillLower === 'java';
    }
    if (keyLower === 'sql') {
      return skillLower.includes('sql');
    }
    if (keyLower === 'git') {
      return skillLower.includes('git');
    }
    if (keyLower === 'linux') {
      return skillLower.includes('linux');
    }
    if (keyLower === 'docker') {
      return skillLower.includes('docker') || skillLower.includes('devops');
    }
    if (keyLower === 'dsa') {
      return skillLower.includes('dsa') || skillLower.includes('data structures');
    }
    if (keyLower === 'machine learning' || keyLower === 'ml' || keyLower === 'ai') {
      return skillLower.includes('machine learning') || skillLower.includes('ai') || skillLower.includes('statistics');
    }
    if (keyLower === 'data engineering' || keyLower === 'de') {
      return skillLower.includes('data engineering') || skillLower.includes('airflow') || skillLower.includes('spark') || skillLower.includes('modelling');
    }
    return skillLower.includes(keyLower);
  });

  return matched.length > 0 ? matched : COMPREHENSIVE_QUESTION_BANK.slice(0, 6);
}
