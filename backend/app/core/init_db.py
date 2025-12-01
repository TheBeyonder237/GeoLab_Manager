"""
Script d'initialisation de la base de données
Crée un utilisateur administrateur par défaut
"""
from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine
from app.models import Base, User
from app.core.security import get_password_hash
from app.models.user import UserRole


def init_db():
    """Initialise la base de données avec les tables et un admin par défaut"""
    # Créer les tables
    Base.metadata.create_all(bind=engine)
    
    db: Session = SessionLocal()
    try:
        # Vérifier si un admin existe déjà
        admin = db.query(User).filter(User.role == UserRole.ADMIN).first()
        
        if not admin:
            # Créer un utilisateur admin par défaut
            admin_user = User(
                email="admin@geolab.test",
                username="admin",
                full_name="Administrateur",
                hashed_password=get_password_hash("admin123"),
                role=UserRole.ADMIN,
                is_active=True
            )
            db.add(admin_user)
            db.commit()
            print("✅ Utilisateur administrateur créé:")
            print("   Email: admin@test.test")
            print("   Username: admin")
            print("   Password: admin123")
            print("   ⚠️  Changez ce mot de passe après la première connexion!")
        else:
            # Mettre à jour l'email si c'est un domaine invalide
            if admin.email.endswith('.test'):
                admin.email = admin.email.replace('.test', '.com')
                db.commit()
                print(f"ℹ️  Email de l'administrateur mis à jour: {admin.email}")
            else:
                print("ℹ️  Un administrateur existe déjà")
        
        # Créer un utilisateur technicien de test
        tech = db.query(User).filter(User.username == "technicien").first()
        if not tech:
            tech_user = User(
                email="technicien@test.test",
                username="technicien",
                full_name="Technicien Test",
                hashed_password=get_password_hash("tech123"),
                role=UserRole.TECHNICIEN,
                is_active=True
            )
            db.add(tech_user)
            db.commit()
            print("✅ Utilisateur technicien créé:")
            print("   Username: technicien")
            print("   Password: tech123")
        else:
            # Mettre à jour l'email si c'est un domaine invalide
            if tech.email.endswith('.test'):
                tech.email = tech.email.replace('.test', '.com')
                db.commit()
                print(f"ℹ️  Email du technicien mis à jour: {tech.email}")
        
    except Exception as e:
        print(f"❌ Erreur lors de l'initialisation: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    init_db()

