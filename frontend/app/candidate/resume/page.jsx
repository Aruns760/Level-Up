"use client";

export default function Resume() {
  return (
    <div className="flex">

      <div className="flex-1 p-6">
        <h1 className="text-2xl font-bold mb-4">Resume Upload</h1>

        <div className="bg-white p-4 rounded shadow">
          <input type="file" className="mb-4" />
          <button className="bg-black text-white px-4 py-2 rounded">
            Upload
          </button>
        </div>
      </div>
    </div>
  );
}