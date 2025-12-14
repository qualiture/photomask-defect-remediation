# Photomask Defect Analytics & Remediation Tracker - Documentation

Welcome to the comprehensive documentation for the Photomask Defect Analytics & Remediation Tracker system.

## Documentation Overview

This documentation is organized to serve different audiences:

### For Business Users

- **[Functional Guide](FUNCTIONAL_GUIDE.md)** - Overview of system capabilities, business processes, and workflows
- **[User Guide](USER_GUIDE.md)** - Step-by-step instructions for daily operations

### For Technical Teams

- **[Technical Guide](TECHNICAL_GUIDE.md)** - System architecture, technology stack, and development guidelines
- **[API Reference](API_REFERENCE.md)** - Complete API documentation for all services and endpoints
- **[Deployment Guide](DEPLOYMENT_GUIDE.md)** - Installation, configuration, and deployment instructions
- **[Architecture Overview](ARCHITECTURE.md)** - Detailed system architecture and design decisions

## Quick Links

- [Main README](../README.md) - Project overview
- [Quick Start Guide](../QUICKSTART.md) - Get the system running quickly
- [Phase 1 Completion](../PHASE1_COMPLETION.md) - Backend implementation details
- [Phase 2 Completion](../PHASE2_COMPLETION.md) - Frontend implementation details

## System Overview

The Photomask Defect Analytics & Remediation Tracker is a comprehensive solution for semiconductor manufacturing facilities to track, analyze, and remediate defects in photomasks. The system provides:

- **Defect Tracking**: Nanometer-precision defect location and characterization
- **Pattern Detection**: AI-powered DBSCAN clustering to identify defect patterns
- **Equipment Correlation**: 24-hour window analysis linking defects to equipment
- **Remediation Workflow**: Automated approval process for repair orders
- **Cost-Benefit Analysis**: AI-driven recommendations for repair vs. replace vs. retire decisions
- **Interactive Visualization**: Real-time defect maps and analytics dashboards

## Technology Stack

- **Backend**: SAP Cloud Application Programming Model (CAP) with Node.js
- **Frontend**: React 19 + TypeScript + Vite + Material-UI
- **Database**: SQLite (development) / SAP HANA (production-ready)
- **Visualization**: D3.js, Konva, Recharts
- **API**: OData v4 REST services

## Getting Started

1. **Business Users**: Start with the [User Guide](USER_GUIDE.md)
2. **Developers**: Begin with the [Technical Guide](TECHNICAL_GUIDE.md) and [Quick Start Guide](../QUICKSTART.md)
3. **Administrators**: See the [Deployment Guide](DEPLOYMENT_GUIDE.md)
4. **API Consumers**: Reference the [API Documentation](API_REFERENCE.md)

## Support

For issues, questions, or feature requests:
- Review the relevant documentation section
- Check the troubleshooting sections in each guide
- Contact the development team

---

**Last Updated**: December 2025
**Version**: 1.0 (Phase 2 Complete)
**Status**: Production-Ready MVP
