import React from 'react';
import SearchForm from './components/SearchForm';

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex bg-blue-950 p-4 items-center">
        <img src='./src/assets/image.webp' alt='kollegeapply logo' className='h-11 inline-block mr-2 ml-3' />
      </div>
      <SearchForm />
    </div>
  );
}

export default App;