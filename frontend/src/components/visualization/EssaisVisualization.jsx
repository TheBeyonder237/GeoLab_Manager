import { useState, useEffect, useRef } from 'react';
import { Download, ZoomIn, ZoomOut, Move, RotateCw } from 'lucide-react';
import * as d3 from 'd3';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export default function EssaisVisualization({ data, type }) {
  const svgRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [tool, setTool] = useState('pan'); // 'pan', 'zoom', 'rotate'

  useEffect(() => {
    if (!data) return;
    renderVisualization();
  }, [data, type, zoom, pan]);

  const renderVisualization = () => {
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 800;
    const height = 600;
    const margin = { top: 40, right: 40, bottom: 60, left: 60 };

    const g = svg
      .append("g")
      .attr("transform", "translate(" + (margin.left + pan.x) + "," + (margin.top + pan.y) + ") scale(" + zoom + ")");

    switch (type) {
      case 'proctor':
        renderProctorCurve(g, width - margin.left - margin.right, height - margin.top - margin.bottom);
        break;
      case 'granulometrie':
        renderGranulometrieCurve(g, width - margin.left - margin.right, height - margin.top - margin.bottom);
        break;
      case 'cbr':
        renderCBRCurve(g, width - margin.left - margin.right, height - margin.top - margin.bottom);
        break;
      case 'atterberg':
        renderAtterbergDiagram(g, width - margin.left - margin.right, height - margin.top - margin.bottom);
        break;
    }
  };

  const renderProctorCurve = (g, width, height) => {
    const x = d3.scaleLinear()
      .domain([d3.min(data.points, d => d.teneur_eau) - 2, d3.max(data.points, d => d.teneur_eau) + 2])
      .range([0, width]);

    const y = d3.scaleLinear()
      .domain([d3.min(data.points, d => d.densite_seche) - 0.1, d3.max(data.points, d => d.densite_seche) + 0.1])
      .range([height, 0]);

    // Axes
    g.append("g")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x))
      .append("text")
      .attr("x", width / 2)
      .attr("y", 40)
      .attr("fill", "currentColor")
      .attr("text-anchor", "middle")
      .text("Teneur en eau (%)");

    g.append("g")
      .call(d3.axisLeft(y))
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -40)
      .attr("x", -height / 2)
      .attr("fill", "currentColor")
      .attr("text-anchor", "middle")
      .text("Densité sèche (g/cm³)");

    // Courbe
    const line = d3.line()
      .x(d => x(d.teneur_eau))
      .y(d => y(d.densite_seche))
      .curve(d3.curveCatmullRom);

    g.append("path")
      .datum(data.points)
      .attr("fill", "none")
      .attr("stroke", "steelblue")
      .attr("stroke-width", 2)
      .attr("d", line);

    // Points
    g.selectAll("circle")
      .data(data.points)
      .enter()
      .append("circle")
      .attr("cx", d => x(d.teneur_eau))
      .attr("cy", d => y(d.densite_seche))
      .attr("r", 4)
      .attr("fill", "steelblue");

    // Point OPM
    if (data.opm && data.densite_seche_max) {
      g.append("circle")
        .attr("cx", x(data.opm))
        .attr("cy", y(data.densite_seche_max))
        .attr("r", 6)
        .attr("fill", "red")
        .attr("stroke", "white")
        .attr("stroke-width", 2);

      g.append("text")
        .attr("x", x(data.opm))
        .attr("y", y(data.densite_seche_max) - 10)
        .attr("text-anchor", "middle")
        .attr("fill", "red")
        .text("OPM");
    }
  };

  // Implémentez les autres méthodes de rendu similaires pour les autres types d'essais...

  const handleMouseDown = (e) => {
    if (tool === 'pan') {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - pan.x,
        y: e.clientY - pan.y
      });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging && tool === 'pan') {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e) => {
    if (tool === 'zoom') {
      e.preventDefault();
      const newZoom = zoom * (e.deltaY > 0 ? 0.9 : 1.1);
      setZoom(Math.max(0.1, Math.min(5, newZoom)));
    }
  };

  const exportToPNG = async () => {
    const canvas = await html2canvas(svgRef.current.parentNode);
    const link = document.createElement('a');
    link.download = type + "_visualization.png";
    link.href = canvas.toDataURL();
    link.click();
  };

  const exportToPDF = async () => {
    const canvas = await html2canvas(svgRef.current.parentNode);
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('l', 'mm', 'a4');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(type + "_visualization.pdf");
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <button
            onClick={() => setTool('pan')}
            className={"p-2 rounded-lg " + (tool === 'pan' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100')}
          >
            <Move className="w-5 h-5" />
          </button>
          <button
            onClick={() => setTool('zoom')}
            className={"p-2 rounded-lg " + (tool === 'zoom' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100')}
          >
            <ZoomIn className="w-5 h-5" />
          </button>
          <button
            onClick={() => {
              setZoom(1);
              setPan({ x: 0, y: 0 });
            }}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            <RotateCw className="w-5 h-5" />
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportToPNG}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            <Download className="w-4 h-4 mr-2 inline" />
            PNG
          </button>
          <button
            onClick={exportToPDF}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            <Download className="w-4 h-4 mr-2 inline" />
            PDF
          </button>
        </div>
      </div>

      <div
        className="relative bg-white rounded-lg shadow-lg overflow-hidden"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <svg
          ref={svgRef}
          width="800"
          height="600"
          className="w-full h-full"
          style={{ cursor: tool === 'pan' ? 'grab' : 'crosshair' }}
        />
      </div>
    </div>
  );
}
