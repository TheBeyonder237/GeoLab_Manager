"""
Générateur de rapports PDF pour les statistiques
"""
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak, Image, Drawing
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.graphics.shapes import Drawing, Line, String
from reportlab.graphics.charts.barcharts import VerticalBarChart
from reportlab.graphics.charts.linecharts import HorizontalLineChart
from io import BytesIO
from datetime import datetime
from typing import Dict, Any
from app.models.essai import TypeEssai

def generer_rapport_statistiques(stats: Dict[str, Any], type_essai: TypeEssai) -> BytesIO:
    """
    Génère un rapport PDF des statistiques pour un type d'essai
    
    Args:
        stats: Dictionnaire contenant les statistiques
        type_essai: Type d'essai concerné
    
    Returns:
        BytesIO: Buffer contenant le PDF
    """
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    story = []
    styles = getSampleStyleSheet()
    
    # Styles personnalisés
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=18,
        textColor=colors.HexColor('#1a1a1a'),
        spaceAfter=30,
        alignment=TA_CENTER
    )
    
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=colors.HexColor('#2c3e50'),
        spaceAfter=12,
        spaceBefore=12
    )
    
    # Titre du rapport
    title = f"Rapport Statistique - {type_essai.value.upper()}"
    story.append(Paragraph(title, title_style))
    story.append(Spacer(1, 0.5*cm))
    
    # Informations générales
    story.append(Paragraph("Informations Générales", heading_style))
    
    info_data = [
        ["Nombre total d'essais", str(stats['nombre_total'])],
        ["Essais validés", str(stats['nombre_valides'])],
        ["Taux de validation", f"{(stats['nombre_valides']/stats['nombre_total']*100):.1f}%"],
    ]
    
    info_table = Table(info_data, colWidths=[10*cm, 7*cm])
    info_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#ecf0f1')),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 1, colors.grey),
    ]))
    
    story.append(info_table)
    story.append(Spacer(1, 0.5*cm))
    
    # Statistiques spécifiques selon le type d'essai
    story.append(Paragraph("Statistiques Détaillées", heading_style))
    
    if type_essai == TypeEssai.PROCTOR and 'densite_moyenne' in stats:
        stats_data = [
            ["Paramètre", "Valeur", "Unité"],
            ["Densité sèche minimale", f"{stats['densite_min']:.3f}", "g/cm³"],
            ["Densité sèche maximale", f"{stats['densite_max']:.3f}", "g/cm³"],
            ["Densité sèche moyenne", f"{stats['densite_moyenne']:.3f}", "g/cm³"],
            ["Densité sèche médiane", f"{stats['densite_mediane']:.3f}", "g/cm³"],
            ["Écart-type", f"{stats['densite_ecart_type']:.3f}", "g/cm³"],
        ]
    
    elif type_essai == TypeEssai.CBR and 'cbr_moyen' in stats:
        stats_data = [
            ["Paramètre", "Valeur", "Unité"],
            ["CBR minimal", f"{stats['cbr_min']:.1f}", "%"],
            ["CBR maximal", f"{stats['cbr_max']:.1f}", "%"],
            ["CBR moyen", f"{stats['cbr_moyen']:.1f}", "%"],
            ["CBR médian", f"{stats['cbr_median']:.1f}", "%"],
            ["Écart-type", f"{stats['cbr_ecart_type']:.1f}", "%"],
        ]
    
    elif type_essai == TypeEssai.ATTERBERG and 'wl_moyen' in stats:
        stats_data = [
            ["Paramètre", "Valeur", "Unité"],
            ["WL minimal", f"{stats['wl_min']:.1f}", "%"],
            ["WL maximal", f"{stats['wl_max']:.1f}", "%"],
            ["WL moyen", f"{stats['wl_moyen']:.1f}", "%"],
            ["WL médian", f"{stats['wl_median']:.1f}", "%"],
            ["Écart-type", f"{stats['wl_ecart_type']:.1f}", "%"],
        ]
    
    stats_table = Table(stats_data, colWidths=[8*cm, 5*cm, 4*cm])
    stats_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#34495e')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 11),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
    ]))
    
    story.append(stats_table)
    story.append(Spacer(1, 1*cm))
    
    # Graphique des tendances
    if stats['tendances']:
        story.append(Paragraph("Évolution Temporelle", heading_style))
        
        # Création du graphique
        drawing = Drawing(400, 200)
        
        bc = VerticalBarChart()
        bc.x = 50
        bc.y = 50
        bc.height = 125
        bc.width = 300
        
        # Données pour le graphique
        data = [[t[1] for t in stats['tendances']]]  # Nombre d'essais
        bc.data = data
        
        # Labels de l'axe X
        bc.categoryAxis.categoryNames = [t[0].strftime('%m/%Y') for t in stats['tendances']]
        bc.categoryAxis.labels.boxAnchor = 'ne'
        bc.categoryAxis.labels.angle = 30
        
        # Style du graphique
        bc.bars[0].fillColor = colors.HexColor('#3498db')
        bc.valueAxis.valueMin = 0
        bc.valueAxis.valueMax = max(data[0]) + 2
        bc.valueAxis.valueStep = 1
        
        drawing.add(bc)
        story.append(drawing)
    
    # Pied de page
    story.append(Spacer(1, 1*cm))
    footer_text = f"Rapport généré le {datetime.now().strftime('%d/%m/%Y à %H:%M')} - GeoLab Manager"
    story.append(Paragraph(footer_text, ParagraphStyle(
        'Footer',
        parent=styles['Normal'],
        fontSize=8,
        textColor=colors.grey,
        alignment=TA_CENTER
    )))
    
    # Génération du PDF
    doc.build(story)
    buffer.seek(0)
    return buffer
