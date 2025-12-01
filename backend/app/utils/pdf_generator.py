"""
Générateur de rapports PDF pour les essais géotechniques
"""
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm, mm
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.graphics.shapes import Drawing, Line, String, Group
from reportlab.graphics.charts.linecharts import HorizontalLineChart
from reportlab.graphics.charts.lineplots import LinePlot
from reportlab.graphics.charts.barcharts import VerticalBarChart
from reportlab.graphics.widgets.markers import makeMarker
from typing import Dict, Any, Optional, List
from datetime import datetime
from io import BytesIO
import math
from app.models.essai import Essai, TypeEssai

def generer_rapport_statistiques(stats: Dict[str, Any], type_essai: TypeEssai) -> BytesIO:
    """Génère un rapport PDF des statistiques pour un type d'essai
    
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

def generer_rapport_pdf(essai: Essai, logo_path: Optional[str] = None) -> BytesIO:
    """
    Génère un rapport PDF pour un essai géotechnique
    
    Args:
        essai: Objet Essai avec toutes ses données
        logo_path: Chemin vers le logo du laboratoire (optionnel)
    
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
    
    # En-tête avec logo (si disponible)
    if logo_path:
        try:
            from reportlab.platypus import Image
            logo = Image(logo_path, width=4*cm, height=2*cm)
            story.append(logo)
            story.append(Spacer(1, 0.5*cm))
        except:
            pass
    
    # Titre du rapport
    title = f"Rapport d'Essai Géotechnique - {essai.type_essai.value.upper()}"
    story.append(Paragraph(title, title_style))
    story.append(Spacer(1, 0.5*cm))
    
    # Informations générales
    story.append(Paragraph("Informations Générales", heading_style))

    projet = essai.projet
    if projet:
        projet_nom = projet.nom or essai.projet_nom or "N/A"
        code_projet = projet.code_projet or "N/A"
        client = projet.client or "N/A"
        site = projet.site or "N/A"
        responsable_projet = (
            (projet.responsable.full_name or projet.responsable.username)
            if projet.responsable is not None
            else "N/A"
        )
    else:
        projet_nom = essai.projet_nom or "N/A"
        code_projet = "N/A"
        client = "N/A"
        site = "N/A"
        responsable_projet = "N/A"

    if essai.type_essai == TypeEssai.ATTERBERG:
        norme = "NF P94-051 - Limites d'Atterberg"
    elif essai.type_essai == TypeEssai.CBR:
        norme = "NF P94-078 - CBR"
    elif essai.type_essai == TypeEssai.PROCTOR:
        norme = "NF P94-093 - Proctor"
    elif essai.type_essai == TypeEssai.GRANULOMETRIE:
        norme = "NF P94-056 - Granulométrie"
    else:
        norme = "-"

    info_data = [
        ["Numéro d'essai", essai.numero_essai],
        ["Type d'essai", essai.type_essai.value],
        ["Référence normative", norme],
        ["Statut", essai.statut.value],
        ["Projet", projet_nom],
        ["Code projet", code_projet],
        ["Client", client],
        ["Site", site],
        ["Échantillon", essai.echantillon or "N/A"],
        [
            "Date de l'essai",
            essai.date_essai.strftime("%d/%m/%Y %H:%M") if essai.date_essai else "N/A",
        ],
        [
            "Date de réception",
            essai.date_reception.strftime("%d/%m/%Y %H:%M") if essai.date_reception else "N/A",
        ],
        [
            "Opérateur",
            f"{essai.operateur.full_name or essai.operateur.username}",
        ],
        ["Responsable projet", responsable_projet],
    ]
    
    info_table = Table(info_data, colWidths=[5*cm, 12*cm])
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
    
    # Résultats selon le type d'essai
    story.append(Paragraph("Résultats", heading_style))

    # Synthèse rapide des résultats (aperçu labo)
    synthese_data = [["Paramètre clé", "Valeur", "Unité"]]
    has_synthese = False

    if essai.type_essai == TypeEssai.ATTERBERG and essai.atterberg:
        a = essai.atterberg
        synthese_data.append(["WL", f"{a.wl if a.wl is not None else 'N/A'}", "%"])
        synthese_data.append(["WP", f"{a.wp if a.wp is not None else 'N/A'}", "%"])
        synthese_data.append(["IP", f"{a.ip if a.ip is not None else 'N/A'}", "%"])
        if a.classification:
            synthese_data.append(["Classification", a.classification, "-"])
        has_synthese = True
    elif essai.type_essai == TypeEssai.CBR and essai.cbr:
        c = essai.cbr
        synthese_data.append(["CBR 2.5 mm", f"{c.cbr_25mm if c.cbr_25mm is not None else 'N/A'}", "%"])
        synthese_data.append(["CBR 5.0 mm", f"{c.cbr_50mm if c.cbr_50mm is not None else 'N/A'}", "%"])
        synthese_data.append(["CBR retenu", f"{c.cbr_final if c.cbr_final is not None else 'N/A'}", "%"])
        if c.classe_portance:
            synthese_data.append(["Classe de portance", c.classe_portance, "-"])
        has_synthese = True
    elif essai.type_essai == TypeEssai.PROCTOR and essai.proctor:
        p = essai.proctor
        synthese_data.append(["OPM", f"{p.opm if p.opm is not None else 'N/A'}", "%"])
        synthese_data.append([
            "Densité sèche max.",
            f"{p.densite_seche_max if p.densite_seche_max is not None else 'N/A'}",
            "g/cm³",
        ])
        if p.saturation_optimale is not None:
            synthese_data.append([
                "Saturation optimale",
                f"{p.saturation_optimale}",
                "%",
            ])
        has_synthese = True
    elif essai.type_essai == TypeEssai.GRANULOMETRIE and essai.granulometrie:
        g = essai.granulometrie
        synthese_data.append(["D10", f"{g.d10 if g.d10 is not None else 'N/A'}", "mm"])
        synthese_data.append(["D30", f"{g.d30 if g.d30 is not None else 'N/A'}", "mm"])
        synthese_data.append(["D60", f"{g.d60 if g.d60 is not None else 'N/A'}", "mm"])
        if g.classe_granulometrique:
            synthese_data.append([
                "Classe granulométrique",
                g.classe_granulometrique,
                "-",
            ])
        has_synthese = True

    if has_synthese:
        story.append(Spacer(1, 0.3*cm))
        story.append(Paragraph("Synthèse des résultats", styles['Heading3']))
        synthese_table = Table(synthese_data, colWidths=[7*cm, 5*cm, 3*cm])
        synthese_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1f2937')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('BACKGROUND', (0, 1), (-1, -1), colors.whitesmoke),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ]))
        story.append(synthese_table)
        story.append(Spacer(1, 0.5*cm))

    if essai.type_essai == TypeEssai.ATTERBERG and essai.atterberg:
        story.extend(generer_section_atterberg(essai.atterberg, styles))
    elif essai.type_essai == TypeEssai.CBR and essai.cbr:
        story.extend(generer_section_cbr(essai.cbr, styles))
    elif essai.type_essai == TypeEssai.PROCTOR and essai.proctor:
        story.extend(generer_section_proctor(essai.proctor, styles))
    elif essai.type_essai == TypeEssai.GRANULOMETRIE and essai.granulometrie:
        story.extend(generer_section_granulometrie(essai.granulometrie, styles))
    
    # Observations
    if essai.observations:
        story.append(Spacer(1, 0.5*cm))
        story.append(Paragraph("Observations", heading_style))
        story.append(Paragraph(essai.observations, styles['Normal']))

    # Conditions d'utilisation des résultats
    story.append(Spacer(1, 0.5*cm))
    story.append(Paragraph("Conditions d'utilisation des résultats", heading_style))
    conditions = [
        "Les résultats présentés dans ce rapport ne concernent que l'échantillon décrit dans la section 'Informations Générales'.",
        "Ce rapport ne peut être reproduit que dans son intégralité, sauf accord écrit préalable du laboratoire.",
        "Sauf mention contraire, les essais sont réalisés conformément à la norme indiquée en référence.",
    ]
    for texte in conditions:
        story.append(Paragraph(texte, styles['Normal']))

    story.append(Spacer(1, 0.5*cm))
    story.append(Paragraph("Validation du rapport", heading_style))

    signatures_data = [
        ["Rédigé par", "Vérifié par", "Approuvé par"],
        [
            f"{essai.operateur.full_name or essai.operateur.username}",
            "",
            "",
        ],
        [
            f"Date : {datetime.now().strftime('%d/%m/%Y')}",
            "Date : __________",
            "Date : __________",
        ],
    ]

    signatures_table = Table(signatures_data, colWidths=[6*cm, 6*cm, 6*cm])
    signatures_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
        ('TOPPADDING', (0, 1), (-1, -1), 16),
        ('LINEBELOW', (0, 1), (-1, 1), 0.5, colors.grey),
    ]))
    story.append(signatures_table)

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


def generer_graphique_atterberg(atterberg) -> Drawing:
    """Génère le graphique de la droite de coulabilité"""
    drawing = Drawing(400, 200)
    lp = LinePlot()
    lp.width = 350
    lp.height = 150
    lp.x = 25
    lp.y = 25
    
    # Données pour la droite de coulabilité
    x_data = []
    y_data = []
    
    # Points de mesure
    if atterberg.wl_nombre_coups_1 and atterberg.wl_teneur_eau_1:
        x_data.append(math.log10(atterberg.wl_nombre_coups_1))
        y_data.append(atterberg.wl_teneur_eau_1)
    if atterberg.wl_nombre_coups_2 and atterberg.wl_teneur_eau_2:
        x_data.append(math.log10(atterberg.wl_nombre_coups_2))
        y_data.append(atterberg.wl_teneur_eau_2)
    if atterberg.wl_nombre_coups_3 and atterberg.wl_teneur_eau_3:
        x_data.append(math.log10(atterberg.wl_nombre_coups_3))
        y_data.append(atterberg.wl_teneur_eau_3)
    
    if x_data and y_data:
        # LinePlot attend une liste de séquences de paires (x, y)
        points = list(zip(x_data, y_data))
        lp.data = [points]
        lp.xValueAxis.valueMin = 0.5
        lp.xValueAxis.valueMax = 2.0
        lp.xValueAxis.valueStep = 0.1
        lp.yValueAxis.valueMin = min(y_data) - 5
        lp.yValueAxis.valueMax = max(y_data) + 5
        lp.yValueAxis.valueStep = 2
        
        # Style des points et de la ligne
        lp.lines[0].symbol = makeMarker('Circle')
        lp.lines[0].strokeWidth = 1
        
        drawing.add(lp)
    
    return drawing

def generer_section_atterberg(atterberg, styles):
    """Génère la section Atterberg du rapport"""
    story = []
    
    data = [
        ["Paramètre", "Valeur", "Unité"],
        ["Limite de liquidité (WL)", f"{atterberg.wl or 'N/A'}", "%"],
        ["Limite de plasticité (WP)", f"{atterberg.wp or 'N/A'}", "%"],
        ["Indice de plasticité (IP)", f"{atterberg.ip or 'N/A'}", "%"],
    ]
    
    if atterberg.wl_methode:
        data.append(["Méthode de détermination de WL", atterberg.wl_methode, "-"])
    if atterberg.wr:
        data.append(["Limite de retrait (WR)", f"{atterberg.wr}", "%"])
    if atterberg.ic:
        data.append(["Indice de consistance (IC)", f"{atterberg.ic}", "-"])
    if atterberg.ir:
        data.append(["Indice de retrait (IR)", f"{atterberg.ir}", "-"])
    if atterberg.ia:
        data.append(["Indice d'activité (IA)", f"{atterberg.ia}", "-"])
    if atterberg.classification:
        data.append(["Classification", f"{atterberg.classification}", "-"])
    
    table = Table(data, colWidths=[6*cm, 4*cm, 3*cm])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#34495e')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 11),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
    ]))
    
    story.append(table)

    # Conditions de l'essai et données complémentaires
    conditions_data = [["Paramètre", "Valeur", "Unité"]]
    if atterberg.temperature is not None:
        conditions_data.append(["Température de l'essai", f"{atterberg.temperature}", "°C"])
    if atterberg.humidite_relative is not None:
        conditions_data.append(["Humidité relative", f"{atterberg.humidite_relative}", "%"])

    retrait_data = [["Paramètre", "Valeur", "Unité"]]
    if atterberg.wr_teneur_eau is not None:
        retrait_data.append(["Teneur en eau (retrait)", f"{atterberg.wr_teneur_eau}", "%"])
    if atterberg.volume_initial is not None:
        retrait_data.append(["Volume initial", f"{atterberg.volume_initial}", "cm³"])
    if atterberg.volume_final is not None:
        retrait_data.append(["Volume final", f"{atterberg.volume_final}", "cm³"])
    if atterberg.masse_seche is not None:
        retrait_data.append(["Masse sèche", f"{atterberg.masse_seche}", "g"])

    if len(conditions_data) > 1 or len(retrait_data) > 1:
        story.append(Spacer(1, 0.5*cm))
        story.append(Paragraph("Conditions de l'essai et données de retrait", styles['Heading3']))
    if len(conditions_data) > 1:
        cond_table = Table(conditions_data, colWidths=[6*cm, 4*cm, 3*cm])
        cond_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#4b5563')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('BACKGROUND', (0, 1), (-1, -1), colors.whitesmoke),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ]))
        story.append(cond_table)
    if len(retrait_data) > 1:
        story.append(Spacer(1, 0.3*cm))
        retrait_table = Table(retrait_data, colWidths=[6*cm, 4*cm, 3*cm])
        retrait_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#4b5563')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('BACKGROUND', (0, 1), (-1, -1), colors.whitesmoke),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ]))
        story.append(retrait_table)

    # Tableau des mesures brutes WL
    mesures_wl = [["Essai", "Nombre de coups", "Teneur en eau (%)"]]
    if atterberg.wl_nombre_coups_1 and atterberg.wl_teneur_eau_1 is not None:
        mesures_wl.append([
            "WL 1",
            atterberg.wl_nombre_coups_1,
            atterberg.wl_teneur_eau_1,
        ])
    if atterberg.wl_nombre_coups_2 and atterberg.wl_teneur_eau_2 is not None:
        mesures_wl.append([
            "WL 2",
            atterberg.wl_nombre_coups_2,
            atterberg.wl_teneur_eau_2,
        ])
    if atterberg.wl_nombre_coups_3 and atterberg.wl_teneur_eau_3 is not None:
        mesures_wl.append([
            "WL 3",
            atterberg.wl_nombre_coups_3,
            atterberg.wl_teneur_eau_3,
        ])

    if len(mesures_wl) > 1:
        story.append(Spacer(1, 0.5*cm))
        story.append(Paragraph("Mesures de la coupelle de Casagrande", styles['Heading3']))
        table_wl = Table(mesures_wl, colWidths=[4*cm, 4*cm, 4*cm])
        table_wl.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#4b5563')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('BACKGROUND', (0, 1), (-1, -1), colors.whitesmoke),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ]))
        story.append(table_wl)

    # Tableau des mesures brutes WP
    mesures_wp = [["Essai", "Teneur en eau (%)"]]
    if atterberg.wp_teneur_eau_1 is not None:
        mesures_wp.append(["WP 1", atterberg.wp_teneur_eau_1])
    if atterberg.wp_teneur_eau_2 is not None:
        mesures_wp.append(["WP 2", atterberg.wp_teneur_eau_2])
    if atterberg.wp_teneur_eau_3 is not None:
        mesures_wp.append(["WP 3", atterberg.wp_teneur_eau_3])

    if len(mesures_wp) > 1:
        story.append(Spacer(1, 0.5*cm))
        story.append(Paragraph("Mesures de la limite de plasticité", styles['Heading3']))
        table_wp = Table(mesures_wp, colWidths=[4*cm, 4*cm])
        table_wp.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#4b5563')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('BACKGROUND', (0, 1), (-1, -1), colors.whitesmoke),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ]))
        story.append(table_wp)

    # Ajout du graphique de la droite de coulabilité (Atterberg)
    story.append(Spacer(1, 0.5*cm))
    story.append(Paragraph("Droite de coulabilité", styles['Heading3']))
    story.append(generer_graphique_atterberg(atterberg))
    
    return story


def generer_graphique_cbr(cbr) -> Drawing:
    """Génère la courbe force/pénétration CBR"""
    drawing = Drawing(400, 200)
    lp = LinePlot()
    lp.width = 350
    lp.height = 150
    lp.x = 25
    lp.y = 25
    
    if cbr.points_penetration:
        # Extraction des données
        penetrations = [p.get('penetration_mm') for p in cbr.points_penetration if p.get('penetration_mm') is not None]
        forces = [p.get('force_kN') for p in cbr.points_penetration if p.get('force_kN') is not None]
        
        if penetrations and forces:
            points = list(zip(penetrations, forces))
            lp.data = [points]
            lp.xValueAxis.valueMin = 0
            lp.xValueAxis.valueMax = max(penetrations) + 1
            lp.yValueAxis.valueMin = 0
            lp.yValueAxis.valueMax = max(forces) + 2
            
            # Style de la courbe
            lp.lines[0].strokeWidth = 1
            
            # Ajout des points de référence (2.5mm et 5.0mm)
            if cbr.force_25mm:
                lp.data.append([(2.5, cbr.force_25mm)])
                lp.lines[1].symbol = makeMarker('FilledCircle')
                lp.lines[1].strokeColor = colors.red
            
            if cbr.force_50mm:
                lp.data.append([(5.0, cbr.force_50mm)])
                lp.lines[2].symbol = makeMarker('FilledCircle')
                lp.lines[2].strokeColor = colors.blue
            
            drawing.add(lp)
    
    return drawing

def generer_section_cbr(cbr, styles):
    """Génère la section CBR du rapport"""
    story = []
    
    data = [
        ["Paramètre", "Valeur", "Unité"],
        ["CBR à 2.5mm", f"{cbr.cbr_25mm or 'N/A'}", "%"],
        ["CBR à 5.0mm", f"{cbr.cbr_50mm or 'N/A'}", "%"],
        ["CBR final", f"{cbr.cbr_final or 'N/A'}", "%"],
    ]
    
    if cbr.teneur_eau_finale:
        data.append(["Teneur en eau finale", f"{cbr.teneur_eau_finale}", "%"])
    if cbr.densite_seche_finale:
        data.append(["Densité sèche finale", f"{cbr.densite_seche_finale}", "g/cm³"])
    if cbr.teneur_eau_preparation:
        data.append(["Teneur en eau préparation", f"{cbr.teneur_eau_preparation}", "%"])
    if cbr.densite_seche_preparation:
        data.append(["Densité sèche préparation", f"{cbr.densite_seche_preparation}", "g/cm³"])
    if cbr.gonflement:
        data.append(["Gonflement", f"{cbr.gonflement}", "mm"])
    if cbr.temps_immersion:
        data.append(["Temps d'immersion", f"{cbr.temps_immersion}", "h"])
    if cbr.classe_portance:
        data.append(["Classe de portance", f"{cbr.classe_portance}", "-"])
    if cbr.energie_compactage:
        data.append(["Énergie de compactage", f"{cbr.energie_compactage}", "-"])
    if cbr.nombre_couches:
        data.append(["Nombre de couches", f"{cbr.nombre_couches}", "-"])
    if cbr.nombre_coups:
        data.append(["Nombre de coups par couche", f"{cbr.nombre_coups}", "-"])
    if cbr.module_ev2:
        data.append(["Module EV2", f"{cbr.module_ev2}", "MPa"])
    
    table = Table(data, colWidths=[6*cm, 4*cm, 3*cm])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#34495e')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 11),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
    ]))
    
    story.append(table)

    # Tableau des points de pénétration (courbe CBR)
    if cbr.points_penetration:
        courbe_data = [["Pénétration (mm)", "Force (kN)"]]
        for point in cbr.points_penetration:
            if isinstance(point, dict):
                pen = point.get('penetration_mm')
                force = point.get('force_kN')
                if pen is not None and force is not None:
                    courbe_data.append([pen, force])

        if len(courbe_data) > 1:
            story.append(Spacer(1, 0.5*cm))
            story.append(Paragraph("Points de mesure CBR", styles['Heading3']))
            table_courbe = Table(courbe_data, colWidths=[5*cm, 5*cm])
            table_courbe.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#4b5563')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 10),
                ('BACKGROUND', (0, 1), (-1, -1), colors.whitesmoke),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ]))
            story.append(table_courbe)
    
    # Ajout du graphique
    story.append(Spacer(1, 0.5*cm))
    story.append(Paragraph("Courbe CBR", styles['Heading3']))
    story.append(generer_graphique_cbr(cbr))
    
    return story


def generer_graphique_proctor(proctor) -> Drawing:
    """Génère la courbe Proctor"""
    drawing = Drawing(400, 200)
    lp = LinePlot()
    lp.width = 350
    lp.height = 150
    lp.x = 25
    lp.y = 25
    
    if proctor.points_mesure:
        # Extraction des données
        teneurs_eau = [p.get('teneur_eau') for p in proctor.points_mesure if p.get('teneur_eau') is not None]
        densites_seches = [p.get('densite_seche') for p in proctor.points_mesure if p.get('densite_seche') is not None]
        
        if teneurs_eau and densites_seches:
            points = list(zip(teneurs_eau, densites_seches))
            lp.data = [points]
            lp.xValueAxis.valueMin = min(teneurs_eau) - 2
            lp.xValueAxis.valueMax = max(teneurs_eau) + 2
            lp.yValueAxis.valueMin = min(densites_seches) - 0.1
            lp.yValueAxis.valueMax = max(densites_seches) + 0.1
            
            # Style des points et de la courbe
            lp.lines[0].symbol = makeMarker('Circle')
            lp.lines[0].strokeWidth = 1
            
            # Ajout du point OPM
            if proctor.opm and proctor.densite_seche_max:
                lp.data.append([(proctor.opm, proctor.densite_seche_max)])
                lp.lines[1].symbol = makeMarker('FilledCircle')
                lp.lines[1].strokeColor = colors.red
            
            drawing.add(lp)
    
    return drawing

def generer_section_proctor(proctor, styles):
    """Génère la section Proctor du rapport"""
    story = []
    
    data = [
        ["Paramètre", "Valeur", "Unité"],
        ["Type Proctor", proctor.type_proctor, "-"],
        ["OPM (Teneur en eau optimale)", f"{proctor.opm or 'N/A'}", "%"],
        ["Densité sèche maximale", f"{proctor.densite_seche_max or 'N/A'}", "g/cm³"],
    ]
    
    if proctor.densite_humide_max:
        data.append(["Densité humide maximale", f"{proctor.densite_humide_max}", "g/cm³"])
    if proctor.saturation_optimale:
        data.append(["Saturation optimale", f"{proctor.saturation_optimale}", "%"])
    if proctor.diametre_moule:
        data.append(["Diamètre du moule", f"{proctor.diametre_moule}", "mm"])
    if proctor.hauteur_moule:
        data.append(["Hauteur du moule", f"{proctor.hauteur_moule}", "mm"])
    if proctor.volume_moule:
        data.append(["Volume du moule", f"{proctor.volume_moule}", "cm³"])
    if proctor.energie_compactage:
        data.append(["Énergie de compactage", f"{proctor.energie_compactage}", "-"])
    if proctor.nombre_couches:
        data.append(["Nombre de couches", f"{proctor.nombre_couches}", "-"])
    if proctor.nombre_coups:
        data.append(["Nombre de coups par couche", f"{proctor.nombre_coups}", "-"])
    if proctor.masse_mouton:
        data.append(["Masse du mouton", f"{proctor.masse_mouton}", "kg"])
    if proctor.hauteur_chute:
        data.append(["Hauteur de chute", f"{proctor.hauteur_chute}", "cm"])
    if proctor.masse_moule_vide:
        data.append(["Masse du moule vide", f"{proctor.masse_moule_vide}", "g"])
    
    table = Table(data, colWidths=[6*cm, 4*cm, 3*cm])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#34495e')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 11),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
    ]))
    
    story.append(table)

    # Tableau des points Proctor
    if proctor.points_mesure:
        mesures = [[
            "Teneur en eau (%)",
            "Masse humide (g)",
            "Masse sèche (g)",
            "Densité humide",
            "Densité sèche",
            "Volume (cm³)",
        ]]
        for point in proctor.points_mesure:
            if isinstance(point, dict):
                mesures.append([
                    point.get('teneur_eau'),
                    point.get('masse_humide'),
                    point.get('masse_seche'),
                    point.get('densite_humide'),
                    point.get('densite_seche'),
                    point.get('volume'),
                ])

        if len(mesures) > 1:
            story.append(Spacer(1, 0.5*cm))
            story.append(Paragraph("Points de mesure Proctor", styles['Heading3']))
            table_pts = Table(mesures, colWidths=[3*cm, 3*cm, 3*cm, 3*cm, 3*cm, 3*cm])
            table_pts.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#4b5563')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 9),
                ('BACKGROUND', (0, 1), (-1, -1), colors.whitesmoke),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ]))
            story.append(table_pts)
    
    # Ajout du graphique
    story.append(Spacer(1, 0.5*cm))
    story.append(Paragraph("Courbe Proctor", styles['Heading3']))
    story.append(generer_graphique_proctor(proctor))
    
    return story


def generer_graphique_granulometrie(granulometrie) -> Drawing:
    """Génère la courbe granulométrique"""
    drawing = Drawing(500, 250)
    lp = LinePlot()
    lp.width = 450
    lp.height = 200
    lp.x = 25
    lp.y = 25
    
    if granulometrie.points_tamisage:
        # Extraction et tri des données
        points = sorted(granulometrie.points_tamisage, key=lambda x: x.get('tamis', 0))
        data_points = []
        for p in points:
            tamis_val = p.get('tamis')
            passant = p.get('pourcentage_passant')
            if tamis_val is not None and passant is not None and tamis_val > 0:
                data_points.append((math.log10(tamis_val), passant))
        
        if data_points:
            lp.data = [data_points]
            xs = [x for x, _ in data_points]
            lp.xValueAxis.valueMin = min(xs) - 0.5
            lp.xValueAxis.valueMax = max(xs) + 0.5
            lp.yValueAxis.valueMin = 0
            lp.yValueAxis.valueMax = 100
            
            # Style de la courbe
            lp.lines[0].strokeWidth = 1
            lp.lines[0].symbol = makeMarker('Circle')
            
            # Ajout des lignes de référence D10, D30, D60
            if granulometrie.d10:
                lp.data.append([(math.log10(granulometrie.d10), 10)])
                lp.lines[-1].strokeColor = colors.red
            if granulometrie.d30:
                lp.data.append([(math.log10(granulometrie.d30), 30)])
                lp.lines[-1].strokeColor = colors.blue
            if granulometrie.d60:
                lp.data.append([(math.log10(granulometrie.d60), 60)])
                lp.lines[-1].strokeColor = colors.green
            
            drawing.add(lp)
    
    return drawing

def generer_section_granulometrie(granulometrie, styles):
    """Génère la section Granulométrie du rapport"""
    story = []
    
    data = [
        ["Paramètre", "Valeur", "Unité"],
        ["D10", f"{granulometrie.d10 or 'N/A'}", "mm"],
        ["D30", f"{granulometrie.d30 or 'N/A'}", "mm"],
        ["D50", f"{granulometrie.d50 or 'N/A'}", "mm"],
        ["D60", f"{granulometrie.d60 or 'N/A'}", "mm"],
        ["CU (Coefficient d'uniformité)", f"{granulometrie.cu or 'N/A'}", "-"],
        ["CC (Coefficient de courbure)", f"{granulometrie.cc or 'N/A'}", "-"],
    ]
    
    if granulometrie.d16:
        data.append(["D16", f"{granulometrie.d16}", "mm"])
    if granulometrie.d84:
        data.append(["D84", f"{granulometrie.d84}", "mm"])
    if granulometrie.cz:
        data.append(["CZ (Coefficient de zone)", f"{granulometrie.cz}", "-"])
    
    if granulometrie.classe_granulometrique:
        data.append(["Classification", f"{granulometrie.classe_granulometrique}", "-"])
    if granulometrie.pourcentage_gravier:
        data.append(["% Gravier", f"{granulometrie.pourcentage_gravier}", "%"])
    if granulometrie.pourcentage_sable:
        data.append(["% Sable", f"{granulometrie.pourcentage_sable}", "%"])
    if granulometrie.pourcentage_limon:
        data.append(["% Limon", f"{granulometrie.pourcentage_limon}", "%"])
    if granulometrie.pourcentage_argile:
        data.append(["% Argile", f"{granulometrie.pourcentage_argile}", "%"])
    
    table = Table(data, colWidths=[6*cm, 4*cm, 3*cm])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#34495e')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 11),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
    ]))
    
    story.append(table)

    # Données initiales de l'essai
    init_data = [["Paramètre", "Valeur", "Unité"]]
    if granulometrie.type_essai:
        init_data.append(["Type d'essai", granulometrie.type_essai, "-"])
    if granulometrie.methode:
        init_data.append(["Méthode", granulometrie.methode, "-"])
    if granulometrie.masse_totale_seche is not None:
        init_data.append(["Masse totale sèche", f"{granulometrie.masse_totale_seche}", "g"])
    if granulometrie.masse_apres_lavage is not None:
        init_data.append(["Masse après lavage", f"{granulometrie.masse_apres_lavage}", "g"])
    if granulometrie.pourcentage_fines is not None:
        init_data.append(["Pourcentage de fines", f"{granulometrie.pourcentage_fines}", "%"])

    if len(init_data) > 1:
        story.append(Spacer(1, 0.5*cm))
        story.append(Paragraph("Données initiales de l'essai", styles['Heading3']))
        init_table = Table(init_data, colWidths=[6*cm, 4*cm, 3*cm])
        init_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#4b5563')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('BACKGROUND', (0, 1), (-1, -1), colors.whitesmoke),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ]))
        story.append(init_table)

    # Tableau des points de tamisage
    if granulometrie.points_tamisage:
        tamis_data = [["Tamis (mm)", "% retenu", "% passant", "% cumulé"]]
        for point in granulometrie.points_tamisage:
            if isinstance(point, dict):
                tamis = point.get('tamis')
                pr = point.get('pourcentage_retenu')
                pp = point.get('pourcentage_passant')
                pc = point.get('pourcentage_cumule')
                if tamis is not None:
                    tamis_data.append([tamis, pr, pp, pc])

        if len(tamis_data) > 1:
            story.append(Spacer(1, 0.5*cm))
            story.append(Paragraph("Points de tamisage", styles['Heading3']))
            table_tamis = Table(tamis_data, colWidths=[3*cm, 3*cm, 3*cm, 3*cm])
            table_tamis.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#4b5563')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 9),
                ('BACKGROUND', (0, 1), (-1, -1), colors.whitesmoke),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ]))
            story.append(table_tamis)

    # Points de sédimentométrie
    if granulometrie.points_sedimentometrie:
        sed_data = [["Temps (min)", "Hauteur (cm)", "Diamètre (mm)", "% passant"]]
        for point in granulometrie.points_sedimentometrie:
            if isinstance(point, dict):
                t = point.get('temps_min')
                h = point.get('hauteur_cm')
                d = point.get('diametre_mm')
                pp = point.get('pourcentage_passant')
                sed_data.append([t, h, d, pp])

        if len(sed_data) > 1:
            story.append(Spacer(1, 0.5*cm))
            story.append(Paragraph("Points de sédimentométrie", styles['Heading3']))
            sed_table = Table(sed_data, colWidths=[3*cm, 3*cm, 3*cm, 3*cm])
            sed_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#4b5563')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 9),
                ('BACKGROUND', (0, 1), (-1, -1), colors.whitesmoke),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ]))
            story.append(sed_table)

        if granulometrie.temperature_sedimentometrie is not None or granulometrie.viscosite_dynamique is not None:
            cond_sed = [["Paramètre", "Valeur", "Unité"]]
            if granulometrie.temperature_sedimentometrie is not None:
                cond_sed.append([
                    "Température sédimentométrie",
                    f"{granulometrie.temperature_sedimentometrie}",
                    "°C",
                ])
            if granulometrie.viscosite_dynamique is not None:
                cond_sed.append([
                    "Viscosité dynamique",
                    f"{granulometrie.viscosite_dynamique}",
                    "Pa.s",
                ])
            if len(cond_sed) > 1:
                story.append(Spacer(1, 0.3*cm))
                cond_table = Table(cond_sed, colWidths=[6*cm, 4*cm, 3*cm])
                cond_table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#4b5563')),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, 0), 10),
                    ('BACKGROUND', (0, 1), (-1, -1), colors.whitesmoke),
                    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
                ]))
                story.append(cond_table)

    # Ajout du graphique granulométrique
    story.append(Spacer(1, 0.5*cm))
    story.append(Paragraph("Courbe granulométrique", styles['Heading3']))
    story.append(generer_graphique_granulometrie(granulometrie))

    return story

