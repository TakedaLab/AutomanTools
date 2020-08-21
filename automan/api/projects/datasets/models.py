# -*- coding: utf-8 -*-
from django.db import models
from django.utils import timezone
from projects.models import Projects
from projects.originals.models import DatasetCandidate
from projects.calibrations.models import Calibration


class LabelDataset(models.Model):
    original = models.IntegerField(default=-1)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(default=timezone.now)
    file_path = models.CharField(max_length=255, default='')
    name = models.CharField(max_length=100, default='')
    frame_count = models.IntegerField(default=-1)
    project = models.ForeignKey(Projects, null=True, on_delete=models.CASCADE)


class DatasetDatasetCandidate(models.Model):
    dataset = models.ForeignKey(LabelDataset, on_delete=models.CASCADE)
    dataset_candidate = models.ForeignKey(DatasetCandidate, on_delete=models.CASCADE)
    candidate_calibration = models.ForeignKey(Calibration, on_delete=models.SET_NULL, null=True, blank=True)
